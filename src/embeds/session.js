import { MessageEmbed } from "discord.js";
import axios from "axios";
import moment from "moment-timezone";
import iracing from "../lib/iracing-data-api/index.js";
import constants from "../constants.json" assert { type: "json" };

const { timeOfDay } = constants;

export default async (session) => {
  const tracks = await iracing.getTracks();

  const sessionLaunch = moment(session.launch_at).tz("America/Los_Angeles");
  const raceOffset =
    session.weather.simulated_time_offsets[
      session.weather.simulated_time_offsets.length - 1
    ];
  const tod =
    session.weather.time_of_day === 4
      ? moment(decode(session.weather.simulated_start_time))
          .add(raceOffset, "m")
          .format("ddd, MMM Do YYYY @ h:mma z")
      : timeOfDay[session.weather.time_of_day];

  const forecast = await axios
    .get(session.weather.weather_url)
    .then(({ data }) => data)
    .then((data) => data.find(({ time_offset }) => time_offset >= raceOffset));

  const cloudCover =
    forecast.cloud_cover / 1000 < 1 / 8
      ? "clear"
      : forecast.cloud_cover / 1000 < 3 / 8
      ? "mostly clear"
      : forecast.cloud_cover / 1000 < 5 / 8
      ? "partly cloudy"
      : forecast.cloud_cover / 1000 < 7 / 8
      ? "mostly cloudy"
      : "overcast";

  const windCondition =
    forecast.wind_speed < 500
      ? "moderate breeze"
      : forecast.windw_speed < 400
      ? "gentle breeze"
      : forecast.wind_speed < 300
      ? "light breeze"
      : forecast.wind_speed < 200
      ? "light air"
      : forecast.wind_speed < 100
      ? "calm"
      : "variable";

  const embed = new MessageEmbed()
    .setTitle(
      `**${decode(session.league_name)}${
        session.league_season_name
          ? ` - ${decode(session.league_season_name)}`
          : ""
      }**`
    )
    .setThumbnail(
      `https://images-static.iracing.com${tracks[session.track.track_id]?.logo}`
    )
    .addField(
      `**${sessionLaunch.format("dddd, MMMM Do")}**`,
      `Practice: ${sessionLaunch.format("h:mma z")} (${
        session.is_heat_racing
          ? session.heat_ses_info.pre_qual_practice_length_minutes
          : session.practice_length
      } min)\u000a` +
        `Qual: ${sessionLaunch
          .add(
            session.is_heat_racing
              ? session.heat_ses_info.pre_qual_practice_length_minutes
              : session.practice_length,
            "m"
          )
          .format("h:mma z")} ` +
        `(${
          session.is_heat_racing
            ? session.heat_ses_info.qual_style === 1
              ? `${session.heat_ses_info.qual_laps} laps solo`
              : `${session.heat_ses_info.qual_length_minutes} min open`
            : session.lone_qualify
            ? `${session.qualify_laps} laps solo`
            : `${session.qualify_length} min open`
        })\u000a` +
        `Grid: ${sessionLaunch
          .add(
            session.is_heat_racing
              ? session.heat_ses_info.qual_length_minutes
              : session.qualify_length,
            "m"
          )
          .format("h:mma z")}`
    )
    .addField(
      `\u200B\u000A**${session.track.track_name.replace(/\+/g, " ")}**`,
      `Time of Day: ${tod} (${session.weather.simulated_time_multiplier}x)\u000A` +
        `${
          session.track.config_name
            ? `Configuration: ${decode(session.track.config_name)}\u000A`
            : ""
        }` +
        `${
          session.is_heat_racing
            ? `Format: ${session.heat_ses_info.heat_info_name}`
            : session.race_laps > 0
            ? `Distance: ${session.race_laps} laps`
            : `Distance: ${session.race_length} minutes`
        }\u000A` +
        `Forecast: ${Math.floor(
          (forecast.air_temp / 100) * 1.8 + 32
        )}°F ${cloudCover} with ${windCondition} \u000A` +
        `Conditions: practice ${
          session.track_state.practice_rubber == -1
            ? "automatically generated"
            : `${session.track_state.practice_rubber}%`
        }, ` +
        `qual ${
          session.track_state.qualify_rubber == -1
            ? "carries over"
            : `${session.track_state.qualify_rubber}%`
        }, ` +
        `race ${
          session.track_state.race_rubber == -1
            ? "carries over"
            : `${session.track_state.race_rubber}%`
        }\u000A` +
        `Cautions: ${session.full_course_cautions ? "on" : "local only"}` +
        `${
          session.full_course_cautions
            ? `\u000AG/W/C: ${session.green_white_checkered_limit} attempts`
            : ""
        }`
    )
    .addField(
      "\u200B\u000A",
      `**${
        session.cars.length > 1 ? "Cars" : "Car"
      }:** ${makeCommaSeparatedString(
        session.cars.map((car) => decode(car.car_name))
      )}\u000A` +
        `**Setup:** ${
          session.fixed_setup
            ? `fixed (${session.cars[0].race_setup_filename})`
            : "open"
        }\u000A` +
        `**Fuel:** ${session.cars[0].max_pct_fuel_fill}%\u000A` +
        `**Tires:** ${
          session.cars[0].max_dry_tire_sets != 0
            ? `${session.cars[0].max_dry_tire_sets} sets ` +
              `(starting + ${session.cars[0].max_dry_tire_sets - 1})`
            : "unlimited"
        }\u000A` +
        `${
          session.damage_model === 3
            ? `**Damage:** Off`
            : `**Fast Repairs:** ${
                session.num_fast_tows >= 0
                  ? session.num_fast_tows == 0
                    ? "none"
                    : session.num_fast_tows
                  : "unlimited"
              }`
        }\u000A` +
        `**Incidents:** ${
          session.incident_warn_mode
            ? `penalty @ ${session.incident_warn_param1}x${
                session.incident_warn_param2 > 0
                  ? ` then every ${session.incident_warn_param2}x`
                  : ""
              }\u000a`
            : ""
        }` +
        `${
          session.incident_limit > 0
            ? `disqualify @ ${session.incident_limit}x`
            : ""
        }` +
        `${
          !(session.incident_limit > 0 || session.incident_warn_mode)
            ? "no limit"
            : ""
        }`
    )
    .setTimestamp();

  return embed;
};

function decode(string) {
  return decodeURIComponent(string.replace(/\+/g, " "));
}

function makeCommaSeparatedString(arr, useOxfordComma) {
  const listStart = arr.slice(0, -1).join(", ");
  const listEnd = arr.slice(-1);
  const conjunction =
    arr.length <= 1
      ? ""
      : useOxfordComma && arr.length > 2
      ? ", and "
      : " and ";

  return [listStart, listEnd].join(conjunction);
}
