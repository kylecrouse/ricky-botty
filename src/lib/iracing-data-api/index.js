import axios from "axios";
import createAuthRefreshInterceptorModule from "axios-auth-refresh";
const createAuthRefreshInterceptor = createAuthRefreshInterceptorModule.default ?? createAuthRefreshInterceptorModule;
import { config } from "dotenv";
import CryptoJS from "crypto-js";

config({ path: "./.env" });

const mask = (secret, id) => {
  const hash = CryptoJS.SHA256(secret + id.toLowerCase());
  return CryptoJS.enc.Base64.stringify(hash);
};

class Client {
  constructor(username, password, clientId, clientSecret) {
    this._username = username;
    this._password = password;
    this._clientId = clientId;
    this._clientSecret = clientSecret;

    this._accessToken = null;
    this._refreshToken = null;
    this._tokenExpiry = null;

    this.instance = axios.create({
      baseURL: "https://members-ng.iracing.com",
    });

    // Add Authorization header to all API requests
    this.instance.interceptors.request.use((config) => {
      if (this._accessToken) {
        config.headers.Authorization = `Bearer ${this._accessToken}`;
      }
      return config;
    });

    // Set up auth refresh interceptor
    createAuthRefreshInterceptor(this.instance, () =>
      this._handleAuthFailure()
    );
  }

  _authenticate() {
    const maskedPassword = mask(this._password, this._username);
    const maskedSecret = mask(this._clientSecret, this._clientId);

    return axios
      .post(
        "https://oauth.iracing.com/oauth2/token",
        new URLSearchParams({
          grant_type: "password_limited",
          client_id: this._clientId,
          client_secret: maskedSecret,
          username: this._username,
          password: maskedPassword,
          scope: "iracing.auth",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(({ data }) => {
        this._accessToken = data.access_token;
        this._refreshToken = data.refresh_token;
        this._tokenExpiry = Date.now() + data.expires_in * 1000;
      });
  }

  _refreshAccessToken() {
    return axios
      .post(
        "https://oauth.iracing.com/oauth2/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: this._clientId,
          refresh_token: this._refreshToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(({ data }) => {
        this._accessToken = data.access_token;
        this._refreshToken = data.refresh_token;
        this._tokenExpiry = Date.now() + data.expires_in * 1000;
      });
  }

  _handleAuthFailure() {
    if (this._refreshToken) {
      return this._refreshAccessToken().catch(() => this._authenticate());
    }
    return this._authenticate();
  }

  async getCars(ids = null) {
    const [cars, assets] = await Promise.all([
      this.get("/data/car/get"),
      this.get("/data/car/assets"),
    ]);

    return ids
      ? (!Array.isArray(ids) && (ids = [ids]),
        cars.reduce(
          (a, car) =>
            !ids || ids.includes(car.car_id)
              ? [...a, { ...car, ...assets[car.car_id] }]
              : a,
          []
        ))
      : cars;
  }

  getDriverLookup(search_term) {
    return this.get(
      `/data/lookup/drivers?search_term=${encodeURIComponent(search_term)}`
    );
  }

  getLeague(league_id, include_licenses = false) {
    return this.get(
      `/data/league/get?league_id=${league_id}&include_licenses=${include_licenses}`
    );
  }

  getLeagueSeasons(league_id) {
    return this.get(`/data/league/seasons?league_id=${league_id}`);
  }

  getLeagueSessions(mine = false) {
    return this.get(`/data/league/cust_league_sessions?mine=${mine}`);
  }

  getLeagueSeasonSessions(league_id, season_id) {
    return this.get(
      `/data/league/season_sessions?league_id=${league_id}&season_id=${season_id}`
    );
  }

  getMembers(cust_ids, include_licenses = false) {
    if (!Array.isArray(cust_ids)) cust_ids = [cust_ids];

    return this.get(
      `/data/member/get?cust_ids=${cust_ids.join(
        ","
      )}&include_licenses=${include_licenses}`
    );
  }

  getStatsMemberCareer(cust_id) {
    return this.get(`/data/stats/member_career?cust_id=${cust_id}`);
  }

  getStatsMemberRecentRaces(cust_id) {
    return this.get(`/data/stats/member_recent_races?cust_id=${cust_id}`);
  }

  getStatsMemberSummary(cust_id) {
    return this.get(`/data/stats/member_summary?cust_id=${cust_id}`);
  }

  async getTracks(ids = null) {
    const [tracks, assets] = await Promise.all([
      this.get("/data/track/get"),
      this.getTrackAssets(),
    ]);

    return tracks.reduce(
      (a, track) =>
        !ids || (Array.isArray(ids) && ids.includes(track.track_id))
          ? {
              ...a,
              [track.track_id]: { ...track, ...assets[track.track_id] },
            }
          : a,
      {}
    );
  }

  getTrackAssets() {
    return this.get("/data/track/assets");
  }

  get(url) {
    return this.instance(url)
      .then(({ data: { link } }) => axios.get(link))
      .then(({ data }) => data)
      .catch((err) => console.dir({ err }));
  }
}

export default new Client(
  process.env.IRACING_USERNAME,
  process.env.IRACING_PASSWORD,
  process.env.IRACING_OAUTH_CLIENT_ID,
  process.env.IRACING_OAUTH_CLIENT_SECRET
);
