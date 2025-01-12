/// @file
/// @brief 複数ファイル間で参照するグローバル変数の定義です。

const g_siteRootPath = "https://fire-emblem.fun/";
const g_explicitSiteRootPath = "https://fire-emblem.fun/";

const g_imageRootPath = g_siteRootPath + "AetherRaidTacticsBoard/images/";
const g_corsImageRootPath = "../images/"; // CORS制約を回避するため画像認識のテンプレート等はローカル画像を参照
const g_audioRootPath = g_siteRootPath + "AetherRaidTacticsBoard/audio/";
const g_heroIconRootPath = g_siteRootPath + "images/FehHeroThumbs/";
const g_skillIconRootPath = g_siteRootPath + "images/FehSkillIcons/";
const TurnSettingCookiePrefix = "turn_";
const UnitCookiePrefix = "unit_";
const StructureCookiePrefix = "st_";
const TileCookiePrefix = "t_";
const TurnWideCookieId = "turnwide";
const NameValueDelimiter = '=';
const ElemDelimiter = ':';
const ValueDelimiter = '|';
const ArrayValueElemDelimiter = '+';
const DebugModeDefault = true;
const TabChar = "&emsp;&emsp;";
const G_SKILL_LOG_LEVEL = 7; // TRACE

const g_debugImageRootPath = "/images/AetherRaidTacticsBoard/images/";
const g_debugSkillIconRootPath = "/images/images/FehSkillIcons/";

const G_DEV_SKILL_NUM = 10;
const G_WEAPON_ID_BASE = 100_000;
const G_ASSIST_ID_BASE = 110_000;
const G_SPECIAL_ID_BASE = 120_000;
const G_PASSIVE_A_ID_BASE = 130_000;
const G_PASSIVE_B_ID_BASE = 140_000;
const G_PASSIVE_C_ID_BASE = 150_000;
const G_PASSIVE_S_ID_BASE = 160_000;
const G_PASSIVE_X_ID_BASE = 170_000;
