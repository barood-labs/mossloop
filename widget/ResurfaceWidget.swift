// Home-screen widget (iOS, WidgetKit) — Phase: Capacitor iOS build. Same pattern as Virabloom's CycleWidget:
// the app writes JSON {title, items[3], theme} to a shared keychain item (WidgetBridge plugin) because App Groups
// cannot be created via the App Store Connect API. Widget reads it and shows today's 3 Rediscover items.
import WidgetKit; import SwiftUI; import Security
struct WData: Codable { var title: String; var items: [String]; var theme: String }
func readShared() -> WData? { let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "resurface.widget",
  kSecAttrAccessGroup as String: "$(AppIdentifierPrefix)com.baroodlabs.resurface.shared", kSecReturnData as String: true]
  var r: AnyObject?; guard SecItemCopyMatching(q as CFDictionary, &r) == errSecSuccess, let d = r as? Data else { return nil }; return try? JSONDecoder().decode(WData.self, from: d) }
struct E: TimelineEntry { let date: Date; let d: WData }
struct Prov: TimelineProvider { let ph = WData(title: "Resurface", items: ["Clean AC filter"], theme: "leaf")
  func placeholder(in c: Context) -> E { E(date: .now, d: ph) }
  func getSnapshot(in c: Context, completion: @escaping (E) -> Void) { completion(E(date: .now, d: readShared() ?? ph)) }
  func getTimeline(in c: Context, completion: @escaping (Timeline<E>) -> Void) { completion(Timeline(entries: [E(date: .now, d: readShared() ?? ph)], policy: .after(.now.addingTimeInterval(3600)))) } }
struct V: View { let e: E; var bg: Color { e.d.theme == "sand" ? Color(red: 0.95, green: 0.85, blue: 0.6) : e.d.theme == "night" ? Color(red: 0.1, green: 0.14, blue: 0.17) : Color(red: 0.19, green: 0.42, blue: 0.31) }
  var body: some View { VStack(alignment: .leading, spacing: 4) { Text("🌿 " + e.d.title).font(.headline); ForEach(e.d.items.prefix(3), id: \.self) { Text("• " + $0).font(.caption).lineLimit(1) } }
  .foregroundColor(e.d.theme == "sand" ? .black : .white).containerBackground(bg, for: .widget) } }
@main struct ResurfaceWidget: Widget { var body: some WidgetConfiguration { StaticConfiguration(kind: "ResurfaceWidget", provider: Prov()) { V(e: $0) }.configurationDisplayName("Resurface").supportedFamilies([.systemSmall, .systemMedium]) } }
