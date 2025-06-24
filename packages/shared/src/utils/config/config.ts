import { brand_config } from './brand-config';
import { getPlatformFromUrl } from './platform';

export const domain_app_ids = {
    // these domains as supported "production domains" - KEEP ORIGINAL IDs
    'deriv.app': 16929,
    'app.deriv.com': 16929,
    'staging-app.deriv.com': 16303,
    'app.deriv.me': 1411,
    'staging-app.deriv.me': 1411,
    'app.deriv.be': 30767,
    'staging-app.deriv.be': 31186,
    'binary.com': 1,
    'test-app.deriv.com': 51072,
    'tradeprofxapp.pages.dev': 80074, // YOUR domain with YOUR app ID
};

export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain);

export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\\.)?${domain.replace('.', '\\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const isStaging = () => {
    const staging_domains = Object.keys(domain_app_ids)
        .filter(domain => domain.includes('staging'))
        .map(domain => `(www\\.)?${domain.replace('.', '\\.')}`);

    return new RegExp(`^(${staging_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const isTestLink = () => {
    return /^((.*)\.binary\.sx)$/i.test(window.location.hostname);
};

export const isLocal = () => /^localhost$/i.test(window.location.hostname);

export const localStoragePrefix = () => {
    let prefix = '';
    if (isStaging()) {
        prefix = 'staging_';
    } else if (isTestLink()) {
        prefix = 'test_';
    }

    return prefix;
};

export const urlForCurrentDomain = (path: string) => `${window.location.protocol}//${window.location.hostname}/${path}`;

export const urlFor = (path: string, parms: string | null = null) => {
    const l = window.location;

    if (!/^\/(br_)/.test(path)) {
        const current_domain = getCurrentProductionDomain();
        if (current_domain && current_domain !== 'binary.com') {
            path = path.replace(/^\//, '/app/');
        }
    }
    return l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + path + (parms ? '?' + parms : '');
};

export const websiteUrl = () => {
    return brand_config.website_url || 'https://deriv.com';
};

const user_app_id = ''; // TEMPORARY ROLLBACK - you can insert Application ID of your registered application here

export const getAppId = () => {
    let app_id = null;
    const user_app_id_string = user_app_id?.toString();
    const current_domain = window.location.hostname;

    if (user_app_id_string && user_app_id_string.length > 0) {
        app_id = user_app_id_string;
    } else if (current_domain && Object.keys(domain_app_ids).includes(current_domain)) {
        app_id = domain_app_ids[current_domain as keyof typeof domain_app_ids];
    } else {
        app_id = 16929; // deriv.app
    }
    return app_id;
};

export const getSocketURL = () => {
    const local_storage_server_url = localStorage.getItem('config.server_url');
    if (local_storage_server_url) return local_storage_server_url;

    let active_loginid_from_local_storage = localStorage.getItem('active_loginid');
    const loginid_array = JSON.parse(localStorage.getItem('accountsList') || '[]');

    if (!active_loginid_from_local_storage && loginid_array.length > 0) {
        active_loginid_from_local_storage = loginid_array[0].loginid;
    }

    const server_url = localStorage.getItem(`config.server_url.${active_loginid_from_local_storage}`) || getDefaultServerURL();
    return server_url;
};

export const getDefaultServerURL = () => {
    const platform = getPlatformFromUrl();
    const server_url = platform === 'p01' ? 'blue.derivws.com' : 'ws.derivws.com';
    return server_url;
};
