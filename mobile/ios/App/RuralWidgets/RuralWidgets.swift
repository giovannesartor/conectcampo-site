import WidgetKit
import SwiftUI
import WeatherKit
import CoreLocation
import UIKit

private let brand = Color(red: 0, green: 0.45, blue: 0.24)
private let api = URL(string: "https://app.conectcampo.digital/api/v1/widgets/market")!
private let setup = URL(string: "conectcampo://dashboard/widgets")!

struct GrainPrice: Decodable, Identifiable {
    var id: String { symbol }
    let symbol: String
    let name: String
    let price: Double
    let region: String
    let observedOn: String
    let unit: String
}
struct GrainResponse: Decodable { let prices: [GrainPrice]; let stale: Bool }
struct RuralEntry: TimelineEntry {
    let date: Date
    var market: GrainResponse? = nil
    var snapshot: RuralWidgetSnapshot? = nil
    var temperature: Double? = nil
    var low: Double? = nil
    var high: Double? = nil
    var rain: Double? = nil
    var symbol = "cloud.sun"
    var attribution: Data? = nil
    var legalURL: URL? = nil
    var observedAt: Date? = nil
    var message: String? = nil
}

struct RuralProvider: TimelineProvider {
    let kind: String
    func placeholder(in context: Context) -> RuralEntry { RuralEntry(date: Date(), message: "Abra o ConectCampo") }
    func getSnapshot(in context: Context, completion: @escaping (RuralEntry) -> Void) {
        // Gallery previews never expose the signed-in user's information.
        completion(RuralEntry(date: Date(), message: "Configure no aplicativo"))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<RuralEntry>) -> Void) {
        Task {
            var entry = RuralEntry(date: Date(), snapshot: RuralWidgetStore.read())
            if kind == "market" {
                do {
                    var request = URLRequest(url: api, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 12)
                    request.setValue("application/json", forHTTPHeaderField: "Accept")
                    let (data, response) = try await URLSession.shared.data(for: request)
                    guard (response as? HTTPURLResponse)?.statusCode == 200, data.count < 32000 else { throw URLError(.badServerResponse) }
                    let market = try JSONDecoder().decode(GrainResponse.self, from: data)
                    guard Set(market.prices.map(\.symbol)) == Set(["SOJA", "MILHO"]), market.prices.count == 2,
                          market.prices.allSatisfy({ $0.price.isFinite && $0.price > 0 }) else { throw URLError(.cannotParseResponse) }
                    entry.market = market
                } catch { entry.message = "Cotações indisponíveis. Toque para consultar." }
            } else if kind == "weather" {
                if let location = entry.snapshot?.location {
                    do {
                        let service = WeatherService.shared
                        let (current, daily) = try await service.weather(for: CLLocation(latitude: location.latitude, longitude: location.longitude), including: .current, .daily)
                        let attribution = try await service.attribution
                        // Widget rendering does not reliably perform AsyncImage requests.
                        let markRequest = URLRequest(url: attribution.combinedMarkDarkURL, timeoutInterval: 10)
                        let (mark, response) = try await URLSession.shared.data(for: markRequest)
                        guard (response as? HTTPURLResponse)?.statusCode == 200, mark.count < 100000,
                              UIImage(data: mark) != nil else { throw URLError(.cannotDecodeContentData) }
                        entry.temperature = current.temperature.converted(to: .celsius).value
                        entry.symbol = current.symbolName
                        entry.low = daily.forecast.first?.lowTemperature.converted(to: .celsius).value
                        entry.high = daily.forecast.first?.highTemperature.converted(to: .celsius).value
                        entry.rain = daily.forecast.first?.precipitationChance
                        entry.observedAt = current.date
                        entry.attribution = mark
                        entry.legalURL = attribution.legalPageURL
                    } catch { entry.message = "Previsão indisponível. Tente novamente mais tarde." }
                } else { entry.message = "Escolha sua propriedade no app para ver a previsão." }
            }
            // A logout, account switch or settings change may happen during the
            // asynchronous WeatherKit request. Never publish the old snapshot.
            if kind != "market", let revision = entry.snapshot?.revision,
               RuralWidgetStore.read()?.revision != revision {
                entry = RuralEntry(date: Date(), message: "Abra o app para atualizar seus widgets.")
            }
            var entries = [entry]
            // Expire private snapshots even if iOS postpones the next network reload.
            if kind == "agenda", let snapshot = entry.snapshot {
                let expiry = Date(timeIntervalSince1970: snapshot.updatedAt + 12 * 3600)
                if expiry > entry.date {
                    // Counts switch at midnight even when iOS delays a reload.
                    var calendar = Calendar(identifier: .gregorian)
                    calendar.timeZone = TimeZone(identifier: "America/Sao_Paulo")!
                    if let midnight = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: entry.date)), midnight < expiry {
                        entries.append(RuralEntry(date: midnight, snapshot: snapshot))
                    }
                    entries.append(RuralEntry(date: expiry, message: "Abra o app para atualizar a agenda."))
                }
            } else if kind == "weather", entry.temperature != nil {
                entries.append(RuralEntry(date: entry.date.addingTimeInterval(3 * 3600), message: "Abra o app para atualizar a previsão."))
            } else if kind == "market", entry.market != nil {
                entries.append(RuralEntry(date: entry.date.addingTimeInterval(6 * 3600), message: "Toque para atualizar as cotações."))
            }
            completion(Timeline(entries: entries, policy: .after(Date().addingTimeInterval(kind == "market" ? 3 * 3600 : 3600))))
        }
    }
}

struct RuralWidgetView: View {
    let entry: RuralEntry
    let kind: String
    @Environment(\.widgetFamily) private var family
    private var medium: Bool { family == .systemMedium }
    private var title: String { kind == "market" ? "Mercado de grãos" : kind == "weather" ? "Clima no campo" : "Agenda rural" }
    private var icon: String { kind == "market" ? "leaf.fill" : kind == "weather" ? "cloud.sun.fill" : "calendar" }
    private var route: URL { URL(string: "conectcampo://dashboard/\(kind == "market" ? "quotes" : kind == "agenda" ? "calendar" : "widgets")")! }
    private var freshAgenda: Bool { entry.snapshot?.agendaEnabled == true && entry.date.timeIntervalSince1970 - (entry.snapshot?.updatedAt ?? 0) < 12 * 3600 }

    var body: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) { Color(.systemBackground) }
        } else { content.padding(14).background(Color(.systemBackground)) }
    }
    private var content: some View {
        VStack(alignment: .leading, spacing: medium ? 8 : 6) {
            HStack(spacing: 6) {
                Image(systemName: icon).foregroundStyle(brand)
                Text(title).font(.system(size: 12, weight: .semibold)).lineLimit(1).minimumScaleFactor(0.85)
                Spacer(minLength: 0)
            }
            if let message = entry.message {
                Spacer(minLength: 0)
                Text(message).font(.system(size: 13)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            } else if kind == "market", let market = entry.market {
                ForEach(market.prices) { price in
                    HStack {
                        Text(price.name).font(.system(size: 13, weight: .medium))
                        Spacer(minLength: 4)
                        Text(price.price, format: .currency(code: "BRL").locale(Locale(identifier: "pt_BR")))
                            .font(.system(size: medium ? 22 : 17, weight: .bold, design: .rounded)).minimumScaleFactor(0.75).lineLimit(1)
                    }
                }
                Text("Paraná · média · R$/saca 60 kg").font(.system(size: 9)).foregroundStyle(.secondary)
                if let observed = market.prices.first?.observedOn {
                    Text("DERAL/SEAB-PR · \(dateLabel(observed))\(market.stale ? " · desatualizado" : "")").font(.system(size: 9)).foregroundStyle(.secondary)
                }
            } else if kind == "weather", let temperature = entry.temperature {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.snapshot?.location?.label ?? "Propriedade").font(.system(size: 11)).lineLimit(1)
                        Text("\(Int(temperature.rounded()))°").font(.system(size: medium ? 40 : 32, weight: .bold, design: .rounded))
                    }
                    Spacer(minLength: 2)
                    Image(systemName: entry.symbol).font(.system(size: medium ? 32 : 25)).symbolRenderingMode(.multicolor)
                }.privacySensitive()
                if let low = entry.low, let high = entry.high, let rain = entry.rain {
                    Text("\(Int(low.rounded()))° / \(Int(high.rounded()))° · Chuva \(Int((rain * 100).rounded()))%")
                        .font(.system(size: 10)).foregroundStyle(.secondary).lineLimit(1).minimumScaleFactor(0.8)
                }
                HStack {
                    if let data = entry.attribution, let mark = UIImage(data: data) {
                        Image(uiImage: mark).resizable().scaledToFit().frame(width: 62, height: 13).padding(2).background(.white).cornerRadius(3)
                    }
                    if medium, let url = entry.legalURL { Link("Fontes", destination: url).font(.system(size: 10)).foregroundStyle(brand) }
                    Spacer(minLength: 0)
                    if let observed = entry.observedAt { Text(observed, style: .time).font(.system(size: 9)).foregroundStyle(.secondary) }
                }
            } else if kind == "agenda" {
                if freshAgenda, let snapshot = entry.snapshot {
                    let today = dayString(entry.date)
                    let upcoming = snapshot.days.filter { $0.date >= today }.sorted { $0.date < $1.date }
                    let todayCount = upcoming.first(where: { $0.date == today })?.count ?? 0
                    HStack(alignment: .firstTextBaseline) {
                        Text("\(todayCount)").font(.system(size: 38, weight: .bold, design: .rounded)).foregroundStyle(brand)
                        Text("para hoje").font(.system(size: 13)).foregroundStyle(.secondary)
                    }.privacySensitive()
                    if let next = upcoming.first(where: { $0.date > today }) {
                        Text("Próximo: \(dateLabel(next.date)) · \(next.count) lembrete(s)").font(.system(size: 11)).privacySensitive()
                    } else { Text("Sem próximos vencimentos nos 30 dias consultados.").font(.system(size: 11)).foregroundStyle(.secondary).privacySensitive() }
                    Text("Sem valores ou nomes · atualizado no app").font(.system(size: 9)).foregroundStyle(.secondary)
                } else {
                    Spacer(minLength: 0)
                    Text("Ative ou atualize a agenda em Widgets no aplicativo.").font(.system(size: 13)).foregroundStyle(.secondary)
                    Spacer(minLength: 0)
                }
            }
            Spacer(minLength: 0)
            Text("CONECTCAMPO").font(.system(size: 8, weight: .bold)).tracking(1.4).foregroundStyle(brand)
        }
        .widgetURL((kind == "agenda" && !freshAgenda) || (kind == "weather" && entry.snapshot?.location == nil) ? setup : route)
    }
    private func dateLabel(_ day: String) -> String { let parts = day.split(separator: "-"); return parts.count == 3 ? "\(parts[2])/\(parts[1])" : day }
    private func dayString(_ date: Date) -> String {
        let formatter = DateFormatter(); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.timeZone = TimeZone(identifier: "America/Sao_Paulo"); formatter.dateFormat = "yyyy-MM-dd"; return formatter.string(from: date)
    }
}

struct GrainWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ConectCampoMarket", provider: RuralProvider(kind: "market")) { RuralWidgetView(entry: $0, kind: "market") }
            .configurationDisplayName("Cotações de soja e milho").description("Referências diárias do DERAL/SEAB-PR. Média do Paraná, com fonte e data.").supportedFamilies([.systemSmall, .systemMedium])
    }
}
struct FarmWeatherWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ConectCampoWeather", provider: RuralProvider(kind: "weather")) { RuralWidgetView(entry: $0, kind: "weather") }
            .configurationDisplayName("Clima da propriedade").description("Temperatura, mínima, máxima e chance de chuva. Escolha a propriedade no aplicativo.").supportedFamilies([.systemSmall, .systemMedium])
    }
}
struct FarmAgendaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ConectCampoAgenda", provider: RuralProvider(kind: "agenda")) { RuralWidgetView(entry: $0, kind: "agenda") }
            .configurationDisplayName("Agenda rural").description("Resumo de vencimentos sem valores, títulos ou documentos. Atualizado quando você usa o app.").supportedFamilies([.systemSmall, .systemMedium])
    }
}
@main
struct RuralWidgetsBundle: WidgetBundle {
    var body: some Widget { GrainWidget(); FarmWeatherWidget(); FarmAgendaWidget() }
}
