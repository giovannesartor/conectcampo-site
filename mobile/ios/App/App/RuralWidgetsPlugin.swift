import Capacitor
import WidgetKit
import CryptoKit

@objc(RuralWidgetsPlugin)
public class RuralWidgetsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RuralWidgetsPlugin"
    public let jsName = "ConectCampoWidgets"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]
    private let ownerKey = "conectcampo.widgets.owner"
    private func trusted() -> Bool {
        bridge?.webView?.url?.host == "app.conectcampo.digital" && bridge?.webView?.url?.scheme == "https"
    }
    private func owner(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }
    @objc func setSession(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.trusted(), let session = call.getString("session"), session.count <= 100 else { call.reject("Origem inválida"); return }
            let next = session.isEmpty ? nil : self.owner(session)
            if next != UserDefaults.standard.string(forKey: self.ownerKey) || next == nil {
                do { try RuralWidgetStore.clear() } catch { call.reject("Não foi possível limpar os widgets"); return }
                UserDefaults.standard.set(next, forKey: self.ownerKey)
                WidgetCenter.shared.reloadAllTimelines()
            }
            call.resolve()
        }
    }
    @objc func sync(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.trusted(), let session = call.getString("session"), !session.isEmpty,
                  self.owner(session) == UserDefaults.standard.string(forKey: self.ownerKey),
                  let json = call.getString("snapshot"), json.utf8.count < 16000,
                  let data = json.data(using: .utf8), var snapshot = try? JSONDecoder().decode(RuralWidgetSnapshot.self, from: data),
                  snapshot.updatedAt.isFinite, snapshot.updatedAt <= Date().timeIntervalSince1970 + 300,
                  snapshot.updatedAt > Date().timeIntervalSince1970 - 3600,
                  snapshot.days.count <= 31, snapshot.days.allSatisfy({ $0.count >= 0 && $0.count < 100000 && $0.date.range(of: "^\\d{4}-\\d{2}-\\d{2}$", options: .regularExpression) != nil }) else {
                call.reject("Dados dos widgets inválidos ou sessão encerrada"); return
            }
            guard snapshot.agendaEnabled || snapshot.days.isEmpty,
                  Set(snapshot.days.map(\.date)).count == snapshot.days.count else {
                call.reject("Agenda desativada ou datas duplicadas"); return
            }
            snapshot.revision = UUID().uuidString
            if let location = snapshot.location {
                guard location.latitude.isFinite, location.longitude.isFinite,
                      (-90...90).contains(location.latitude), (-180...180).contains(location.longitude),
                      !location.label.isEmpty, location.label.count <= 80 else { call.reject("Localização inválida"); return }
            }
            do {
                try RuralWidgetStore.write(snapshot)
                WidgetCenter.shared.reloadAllTimelines()
                call.resolve()
            } catch { call.reject("Não foi possível atualizar os widgets") }
        }
    }
    @objc func clear(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.trusted() else { call.reject("Origem inválida"); return }
            do {
                try RuralWidgetStore.clear()
                UserDefaults.standard.removeObject(forKey: self.ownerKey)
                WidgetCenter.shared.reloadAllTimelines()
                call.resolve()
            } catch { call.reject("Não foi possível limpar os widgets") }
        }
    }
}
