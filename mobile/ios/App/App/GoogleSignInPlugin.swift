import Capacitor
import GoogleSignIn

@objc(ConectCampoGoogleSignInPlugin)
public class ConectCampoGoogleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ConectCampoGoogleSignInPlugin"
    public let jsName = "ConectCampoGoogleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]
    private var pending = false

    private func trusted() -> Bool {
        bridge?.webView?.url?.scheme == "https" && bridge?.webView?.url?.host == "app.conectcampo.digital"
    }

    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.trusted(), let nonce = call.getString("nonce"),
                  nonce.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil else {
                call.reject("Solicitação Google inválida.", "INVALID_REQUEST"); return
            }
            guard !self.pending else { call.reject("Já existe uma autenticação em andamento.", "BUSY"); return }
            guard let presenter = self.bridge?.viewController, presenter.view.window != nil else {
                call.reject("Abra o aplicativo para continuar.", "NO_WINDOW"); return
            }
            guard let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
                  let serverID = Bundle.main.object(forInfoDictionaryKey: "GIDServerClientID") as? String else {
                call.reject("Google não configurado nesta versão.", "NOT_CONFIGURED"); return
            }
            self.pending = true
            let signIn = GIDSignIn.sharedInstance
            signIn.configuration = GIDConfiguration(clientID: clientID, serverClientID: serverID)
            // Every attempt uses a fresh server-issued nonce. We do not restore
            // Google credentials or ask for Drive, Gmail or other extra scopes.
            signIn.signOut()
            signIn.signIn(withPresenting: presenter, hint: nil, additionalScopes: nil, nonce: nonce) { result, error in
                self.pending = false
                defer { signIn.signOut() }
                if let error = error as NSError? {
                    let cancelled = error.domain == kGIDSignInErrorDomain && error.code == -5
                    call.reject(cancelled ? "Acesso cancelado." : "Não foi possível entrar com Google.", cancelled ? "SIGN_IN_CANCELLED" : "GOOGLE_ERROR")
                    return
                }
                guard self.trusted(), let token = result?.user.idToken?.tokenString, !token.isEmpty else {
                    call.reject("Resposta Google inválida.", "INVALID_RESPONSE"); return
                }
                // The backend verifies signature, audience, issuer and one-use
                // nonce before creating the independent ConectCampo session.
                call.resolve(["idToken": token])
            }
        }
    }
}
