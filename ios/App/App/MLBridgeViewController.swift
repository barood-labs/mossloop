import UIKit
import Capacitor

// Registers the app's own local plugin (widget data). No network code.
class MLBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MLWidgetPlugin())
    }
}
