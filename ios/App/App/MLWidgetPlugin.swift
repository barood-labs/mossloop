import Foundation
import Capacitor
import WidgetKit

// Stores a tiny, already-localized summary in a shared keychain item (ThisDeviceOnly, never synced) so the widget can show it.
@objc(MLWidgetPlugin)
public class MLWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MLWidgetPlugin"
    public let jsName = "MLWidget"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)]
    @objc func setData(_ call: CAPPluginCall) {
        MLShared.write(call.getString("json") ?? "{}")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
