import "dotenv/config";
import moment from "moment-timezone";
import client from "../src/lib/discord/index.js";
import iracing from "../src/lib/iracing-data-api/index.js";
import SessionEmbed from "../src/embeds/session.js";
import constants from "../src/constants.json" assert { type: "json" };
import config from "../config.json" assert { type: "json" };

const { leagueId } = constants;
const { channelId } = config;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const channel =
    process.env.NODE_ENV === "production"
      ? await client.channels.fetch(channelId.announcements)
      : await client.users
          .fetch("697817102534311996")
          .then((user) => user.createDM());

  const { sessions: leagueSessions = [] } = await iracing.getLeagueSessions();

  // Get array of active seasons for all leagues
  const seasons = await Promise.all(
    leagueId.map((id) => iracing.getLeagueSeasons(id))
  ).then((seasons) => seasons.reduce((a, b) => a.concat(b.seasons), []));

  // Get array of scheduled sessions for seasons
  const sessions = await Promise.all(
    seasons.map(({ league_id, season_id }) =>
      iracing.getLeagueSeasonSessions(league_id, season_id)
    )
  ).then((sessions) =>
    sessions.reduce(
      (a, b) =>
        a.concat(
          b.sessions.map((session) => ({
            ...session,
            ...leagueSessions.find(
              ({ private_session_id }) =>
                private_session_id === session.private_session_id
            ),
          }))
        ),
      []
    )
  );

  console.dir(
    sessions.filter((session) =>
      moment().tz("America/Los_Angeles").isSame(session.launch_at, "day")
    ),
    { depth: null }
  );

  if (!sessions) return exit();

  const embeds = await Promise.all(
    sessions
      .filter((session) =>
        moment().tz("America/Los_Angeles").isSame(session.launch_at, "day")
      )
      .map(SessionEmbed)
  );

  if (embeds.length > 0) await channel.send({ content: "@everyone", embeds });
  else console.log(`No sessions scheduled for today.`);

  exit();
});

function exit() {
  client.destroy();
  process.exit(0);
}
