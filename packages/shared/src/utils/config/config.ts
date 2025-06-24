// Use the original working imports - we need to check if these files exist
// If they don't exist, we'll define the functions locally
let isBot: () => boolean
let isStaging: () => boolean

try {
  // Try to import from the original locations
  const platformModule = require("../platform")
  const urlHelpersModule = require("../url/helpers")
  isBot = platformModule.isBot
  isStaging = urlHelpersModule.isStaging
} catch (error) {
  // If imports fail, define the functions locally
  isBot = () => {
    if (typeof window === "undefined") return false
    return /bot/i.test(window.location.hostname)
  }

  isStaging = () => {
    if (typeof window === "undefined") return false
    return /staging/i.test(window.location.hostname)
  }
}

/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged packages/shared/src/utils/config.js
 *
 */

export const livechat_license_id = 12049137
export const livechat_client_id = "66aa088aad5a414484c1fd1fa8a5ace7"

export const domain_app_ids = {
  // these domains as supported "production domains"
  "deriv.app": 16929, // TODO: [app-link-refactor] - Remove backwards compatibility for `deriv.app`
  "app.deriv.com": 16929,
  "staging-app.deriv.com": 16303,
  "app.deriv.me": 1411,
  "staging-app.deriv.me": 1411, // TODO: setup staging for deriv.me
  "app.deriv.be": 30767,
  "staging-app.deriv.be": 31186,
  "binary.com": 1,
  "test-app.deriv.com": 51072,
  "tradeprofxapp.pages.dev": 80074, // YOUR domain with YOUR app ID
}

export const platform_app_ids = {
  derivgo: 23789,
}

export const getCurrentProductionDomain = () => {
  if (typeof window === "undefined") return null
  return (
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find((domain) => window.location.hostname === domain)
  )
}

export const isProduction = () => {
  if (typeof window === "undefined") return false
  const all_domains = Object.keys(domain_app_ids).map((domain) => `(www\\.)?${domain.replace(".", "\\.")}`)
  return new RegExp(`^(${all_domains.join("|")})$`, "i").test(window.location.hostname)
}

export const isTestLink = () => {
  if (typeof window === "undefined") return false
  return /^((.*)\.binary\.sx)$/i.test(window.location.hostname)
}

export const isLocal = () => {
  if (typeof window === "undefined") return false
  return /localhost(:\d+)?$/i.test(window.location.hostname)
}

/**
 * @deprecated Please use 'WebSocketUtils.getAppId' from '@deriv-com/utils' instead of this.
 */
export const getAppId = () => {
  if (typeof window === "undefined") return 16929

  let app_id = null
  const user_app_id = "" // TEMPORARY ROLLBACK - you can insert Application ID of your registered application here
  const config_app_id = window.localStorage.getItem("config.app_id")
  const current_domain = getCurrentProductionDomain() || ""
  window.localStorage.removeItem("config.platform") // Remove config stored in localstorage if there's any.
  const platform = window.sessionStorage.getItem("config.platform")
  const is_bot = isBot()

  // Added platform at the top since this should take precedence over the config_app_id
  if (platform && platform_app_ids[platform as keyof typeof platform_app_ids]) {
    app_id = platform_app_ids[platform as keyof typeof platform_app_ids]
  } else if (config_app_id) {
    app_id = config_app_id
  } else if (user_app_id.length) {
    window.localStorage.setItem("config.default_app_id", user_app_id)
    app_id = user_app_id
  } else if (isStaging()) {
    window.localStorage.removeItem("config.default_app_id")
    app_id = is_bot ? 19112 : domain_app_ids[current_domain as keyof typeof domain_app_ids] || 16303 // it's being used in endpoint chrome extension - please do not remove
  } else if (/localhost/i.test(window.location.hostname)) {
    app_id = 36300
  } else {
    window.localStorage.removeItem("config.default_app_id")
    app_id = is_bot ? 19111 : domain_app_ids[current_domain as keyof typeof domain_app_ids] || 16929
  }

  return app_id
}

export const getSocketURL = (is_wallets = false) => {
  if (typeof window === "undefined") return "blue.derivws.com"

  const local_storage_server_url = window.localStorage.getItem("config.server_url")
  if (local_storage_server_url) return local_storage_server_url

  let active_loginid_from_url
  const search = window.location.search
  if (search) {
    const params = new URLSearchParams(document.location.search.substring(1))
    active_loginid_from_url = params.get("acct1")
  }
  const local_storage_loginid = is_wallets
    ? window.sessionStorage.getItem("active_wallet_loginid") || window.localStorage.getItem("active_wallet_loginid")
    : window.sessionStorage.getItem("active_loginid") || window.localStorage.getItem("active_loginid")
  const loginid = local_storage_loginid || active_loginid_from_url
  const is_real = loginid && !/^(VRT|VRW)/.test(loginid)

  const server = is_real ? "green" : "blue"
  const server_url = `${server}.derivws.com`

  return server_url
}

export const checkAndSetEndpointFromUrl = () => {
  if (typeof window === "undefined") return false

  if (isTestLink()) {
    const url_params = new URLSearchParams(location.search.slice(1))

    if (url_params.has("qa_server") && url_params.has("app_id")) {
      const qa_server = url_params.get("qa_server") || ""
      const app_id = url_params.get("app_id") || ""

      url_params.delete("qa_server")
      url_params.delete("app_id")

      if (/^(^(www\.)?qa[0-9]{1,4}\.deriv.dev|(.*)\.derivws\.com)$/.test(qa_server) && /^[0-9]+$/.test(app_id)) {
        localStorage.setItem("config.app_id", app_id)
        localStorage.setItem("config.server_url", qa_server)
      }

      const params = url_params.toString()
      const hash = location.hash

      location.href = `${location.protocol}//${location.hostname}${location.pathname}${
        params ? `?${params}` : ""
      }${hash || ""}`

      return true
    }
  }

  return false
}

export const getDebugServiceWorker = () => {
  if (typeof window === "undefined") return false

  const debug_service_worker_flag = window.localStorage.getItem("debug_service_worker")
  if (debug_service_worker_flag) return !!Number.parseInt(debug_service_worker_flag)

  return false
}

// Additional exports that might be needed by other modules
export const urlFor = (path: string, parms: string | null = null) => {
  if (typeof window === "undefined") return path
  const l = window.location

  if (!/^\/(br_)/.test(path)) {
    const current_domain = getCurrentProductionDomain()
    if (current_domain && current_domain !== "binary.com") {
      path = path.replace(/^\//, "/app/")
    }
  }
  return l.protocol + "//" + l.hostname + (l.port ? ":" + l.port : "") + path + (parms ? "?" + parms : "")
}

export const urlForCurrentDomain = (path: string) => {
  if (typeof window === "undefined") return path
  return `${window.location.protocol}//${window.location.hostname}/${path}`
}

export const websiteUrl = () => {
  return "https://deriv.com"
}
