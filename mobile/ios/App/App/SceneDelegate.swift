import UIKit
import Capacitor
import AuthenticationServices

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = ConectCampoBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

class ConectCampoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ConectCampoAppleSignInPlugin())
    }
}

@objc(ConectCampoAppleSignInPlugin)
public class ConectCampoAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "ConectCampoAppleSignInPlugin"
    public let jsName = "ConectCampoAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "credentialState", returnType: CAPPluginReturnPromise)
    ]
    private var pendingCall: CAPPluginCall?
    private var expectedState: String?
    private var authorizationController: ASAuthorizationController?
    private var authorizationWindow: UIWindow?
    private let subjectKey = "conectcampo.apple.lastSubject"

    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.bridge?.webView?.url?.host == "app.conectcampo.digital",
                  self.bridge?.webView?.url?.scheme == "https",
                  let nonce = call.getString("nonce"), nonce.count == 64,
                  let state = call.getString("challengeId"), UUID(uuidString: state) != nil else {
                call.reject("Solicitação Apple inválida.", "INVALID_REQUEST"); return
            }
            guard self.pendingCall == nil else { call.reject("Já existe uma autenticação em andamento.", "BUSY"); return }
            guard let window = self.bridge?.viewController?.view.window else { call.reject("Abra o aplicativo para continuar.", "NO_WINDOW"); return }
            self.authorizationWindow = window
            self.pendingCall = call
            self.expectedState = state
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = nonce
            request.state = state
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.authorizationController = controller
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return authorizationWindow ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { pendingCall = nil; expectedState = nil; authorizationController = nil; authorizationWindow = nil }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              credential.state == expectedState,
              let data = credential.authorizationCode,
              let code = String(data: data, encoding: .utf8) else {
            pendingCall?.reject("Resposta Apple inválida.", "INVALID_RESPONSE"); return
        }
        UserDefaults.standard.set(credential.user, forKey: subjectKey)
        var result: [String: Any] = ["authorizationCode": code]
        if let name = credential.fullName {
            result["name"] = PersonNameComponentsFormatter().string(from: name)
        }
        pendingCall?.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let cancelled = (error as? ASAuthorizationError)?.code == .canceled
        pendingCall?.reject(cancelled ? "Acesso cancelado." : "Não foi possível entrar com Apple.", cancelled ? "SIGN_IN_CANCELLED" : "APPLE_ERROR")
        pendingCall = nil; expectedState = nil; authorizationController = nil; authorizationWindow = nil
    }

    @objc func credentialState(_ call: CAPPluginCall) {
        guard let subject = UserDefaults.standard.string(forKey: subjectKey) else { call.resolve(["revoked": false]); return }
        ASAuthorizationAppleIDProvider().getCredentialState(forUserID: subject) { state, error in
            // A transient network error is not proof of revocation.
            call.resolve(["revoked": error == nil && (state == .revoked || state == .notFound)])
        }
    }
}
