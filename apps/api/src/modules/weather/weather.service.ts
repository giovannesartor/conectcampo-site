import { Injectable } from '@nestjs/common';

export interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainMm: number;
  humidity: number;
  condition: 'ENSOLARADO' | 'PARCIAL' | 'NUBLADO' | 'CHUVA' | 'TEMPESTADE';
}

export interface WeatherAlert {
  type: 'GEADA' | 'SECA' | 'CHUVA_FORTE' | 'GRANIZO' | 'ONDA_CALOR';
  severity: 'BAIXA' | 'MEDIA' | 'ALTA';
  title: string;
  description: string;
}

// Faixas climáticas aproximadas por estado (média anual simplificada)
const STATE_CLIMATE: Record<string, { baseTemp: number; baseRain: number }> = {
  MT: { baseTemp: 26, baseRain: 6 }, MS: { baseTemp: 25, baseRain: 5 },
  GO: { baseTemp: 24, baseRain: 5 }, MG: { baseTemp: 22, baseRain: 4 },
  SP: { baseTemp: 22, baseRain: 4 }, PR: { baseTemp: 20, baseRain: 5 },
  RS: { baseTemp: 19, baseRain: 5 }, SC: { baseTemp: 19, baseRain: 5 },
  BA: { baseTemp: 26, baseRain: 3 }, TO: { baseTemp: 27, baseRain: 5 },
  MA: { baseTemp: 28, baseRain: 4 }, PI: { baseTemp: 28, baseRain: 3 },
};

@Injectable()
export class WeatherService {
  private seedFrom(str: string): () => number {
    let seed = 0;
    for (const ch of str) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
  }

  private conditionFromRain(rain: number): DayForecast['condition'] {
    if (rain > 25) return 'TEMPESTADE';
    if (rain > 8) return 'CHUVA';
    if (rain > 2) return 'NUBLADO';
    if (rain > 0.5) return 'PARCIAL';
    return 'ENSOLARADO';
  }

  getForecast(state = 'SP', city = '') {
    const climate = STATE_CLIMATE[state] ?? { baseTemp: 24, baseRain: 4 };
    const rand = this.seedFrom(`${state}${city}${new Date().toISOString().slice(0, 10)}`);
    const month = new Date().getMonth(); // 0..11
    // Verão (out–mar) mais chuvoso no Brasil central
    const rainSeason = month >= 9 || month <= 2 ? 1.6 : 0.5;

    const days: DayForecast[] = [];
    for (let i = 0; i < 7; i++) {
      const tVar = (rand() - 0.5) * 6;
      const tempMax = Math.round(climate.baseTemp + 4 + tVar);
      const tempMin = Math.round(climate.baseTemp - 4 + tVar * 0.5);
      const rainMm = Number((climate.baseRain * rainSeason * rand() * 2).toFixed(1));
      const humidity = Math.round(55 + rand() * 40);
      const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      days.push({ date, tempMin, tempMax, rainMm, humidity, condition: this.conditionFromRain(rainMm) });
    }

    const current = {
      temp: Math.round((days[0].tempMin + days[0].tempMax) / 2),
      humidity: days[0].humidity,
      condition: days[0].condition,
    };

    return {
      state,
      city,
      current,
      forecast: days,
      alerts: this.buildAlerts(days, state),
      source: 'Simulado (INMET/OpenWeather pluggable)',
    };
  }

  private buildAlerts(days: DayForecast[], state: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const minTemp = Math.min(...days.map((d) => d.tempMin));
    const totalRain = days.reduce((s, d) => s + d.rainMm, 0);
    const maxTemp = Math.max(...days.map((d) => d.tempMax));

    const southern = ['RS', 'SC', 'PR', 'SP', 'MG'].includes(state);
    if (minTemp <= 5 && southern) {
      alerts.push({
        type: 'GEADA',
        severity: minTemp <= 2 ? 'ALTA' : 'MEDIA',
        title: 'Risco de geada',
        description: `Temperatura mínima prevista de ${minTemp}°C nos próximos dias. Proteja lavouras sensíveis.`,
      });
    }
    if (totalRain < 5) {
      alerts.push({
        type: 'SECA',
        severity: totalRain < 2 ? 'ALTA' : 'MEDIA',
        title: 'Baixa precipitação',
        description: `Apenas ${totalRain.toFixed(1)}mm previstos na semana. Avalie irrigação e manejo hídrico.`,
      });
    }
    if (totalRain > 80) {
      alerts.push({
        type: 'CHUVA_FORTE',
        severity: 'ALTA',
        title: 'Excesso de chuva',
        description: `Acumulado de ${totalRain.toFixed(0)}mm previsto. Atenção a operações de campo e colheita.`,
      });
    }
    if (maxTemp >= 38) {
      alerts.push({
        type: 'ONDA_CALOR',
        severity: 'MEDIA',
        title: 'Onda de calor',
        description: `Máximas de até ${maxTemp}°C. Estresse térmico para lavouras e animais.`,
      });
    }
    return alerts;
  }

  getPlantingWindow(crop = 'SOJA', state = 'SP') {
    // Janelas de plantio recomendadas (aproximadas) por cultura no Centro-Sul
    const WINDOWS: Record<string, { start: string; end: string; note: string }> = {
      SOJA: { start: 'Set', end: 'Dez', note: 'Ideal após início das chuvas; respeitar vazio sanitário.' },
      MILHO: { start: 'Set', end: 'Fev', note: 'Milho safrinha entre jan–fev após soja precoce.' },
      ALGODAO: { start: 'Nov', end: 'Jan', note: 'Plantio no início do período chuvoso.' },
      FEIJAO: { start: 'Out', end: 'Fev', note: 'Três safras possíveis conforme região.' },
      TRIGO: { start: 'Abr', end: 'Jun', note: 'Cultura de inverno no Sul.' },
      CAFE: { start: 'Out', end: 'Mar', note: 'Plantio de mudas no período chuvoso.' },
      ARROZ: { start: 'Set', end: 'Dez', note: 'Arroz irrigado no Sul; sequeiro no Centro-Oeste.' },
      CANA: { start: 'Jan', end: 'Mar', note: 'Cana de ano-e-meio; ou set–nov para cana de ano.' },
    };
    const window = WINDOWS[crop] ?? { start: '—', end: '—', note: 'Consulte zoneamento agrícola (ZARC) do MAPA.' };
    const monthIdx = new Date().getMonth();
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { crop, state, window, currentMonth: monthsPt[monthIdx] };
  }
}
