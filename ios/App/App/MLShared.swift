import Foundation
import Security

// Shares the widget summary between app and widget through a team keychain access group (on device only).
enum MLShared {
    static let group = "3S2B5CZC84.com.baroodlabs.mossloop.shared"
    static let account = "widget"
    static func write(_ s: String) {
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrAccount as String: account, kSecAttrAccessGroup as String: group, kSecAttrService as String: "mossloop"]
        SecItemDelete(base as CFDictionary)
        var add = base; add[kSecValueData as String] = Data(s.utf8); add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(add as CFDictionary, nil)
    }
    static func read() -> String? {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrAccount as String: account, kSecAttrAccessGroup as String: group, kSecAttrService as String: "mossloop",
                                kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
}
