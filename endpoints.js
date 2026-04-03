export const api = {
  profile: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/userprofile-service/userprofile/userProfileBase",
    description:
      "Returns user profile information like name, age, displayname, etc.",
  },
  predictions: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/metrics-service/metrics/racepredictions/latest/0",
    description: "Returns latest user race predictions.",
  },
  sleep: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/sleep-service/sleep/dailySleepData",
    description: "Returns weather details of a specific activity.",
    ignore: [
      "sleepMovement",
      "sleepLevels",
      "sleepRestlessMoments",
      "wellnessSpO2SleepSummaryDTO",
      "wellnessEpochSPO2DataDTOList",
      "wellnessEpochRespirationDataDTOList",
      "wellnessEpochRespirationAveragesList",
      "sleepHeartRate",
      "sleepStress",
      "sleepBodyBattery",
      "hrvData",
    ],
    query: {
      date: {
        type: "string (YYYY-MM-DD)",
        required: true,
        description: "Date of the summary",
      },
      nonSleepBufferMinutes: {
        type: "number (min)",
        required: true,
        description: "Non sleep buffer time",
      },
    },
  },
  summary: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/usersummary-service/usersummary/daily/",
    description:
      "Returns a summary of user's health and activity data for the day (stress, steps, battery level, etc.)",
    params: {
      displayName: {
        type: "string",
        description: "User displayName",
      },
    },
    query: {
      calendarDate: {
        type: "string (YYYY-MM-DD)",
        required: true,
        description: "Date of the summary",
      },
    },
  },
  weather: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/activity-service/activity/{activityId}/weather",
    description: "Returns weather details of a specific activity.",
    params: {
      activityId: {
        type: "number",
        description: "Activity ID",
      },
    },
  },
  gear: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/gear-service/gear/filterGear",
    description: "Returns a list of all gears used in a specific activity.",
    query: {
      activityId: {
        type: "number",
        required: true,
        description: "Get gears of an specific activity",
      },
    },
  },
  activites: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/fitnessstats-service/activity/all",
    description: "Returns a list of activities between two dates.",
    query: {
      startDate: {
        type: "string (YYYY-MM-DD)",
        required: true,
        description: "Start date of the listed activities",
      },
      endDate: {
        type: "string (YYYY-MM-DD)",
        required: true,
        description: "End date of the listed activities",
      },
      metric: {
        type: "string",
        required: false,
        description:
          "The metrics to include for each activity in the activity list (only one) (e.g., avgSpeed, distance, duration, activityType...)",
      },
    },
  },
  // Removed because it displays far too much information about activities
  // activities_old: {
  //   method: "GET",
  //   url: "https://connect.garmin.com/gc-api/activitylist-service/activities/search/activities",
  //   description: "Returns a list of all activities.",
  //   ignore: ["userRoles", "ownerProfileImageUrlSmall", "ownerProfileImageUrlMedium", "ownerProfileImageUrlLarge", "beginTimestamp"],
  //   query: {
  //     limit: {
  //       type: "number",
  //       required: true,
  //       description: "Limit of listed activities",
  //     },
  //     start: {
  //       type: "number",
  //       required: true,
  //       description: "Start of the listed activities",
  //     },
  //     activityType: {
  //       type: "string",
  //       required: false,
  //       description: "Filter by activity type (e.g., 'running')",
  //     },
  //     search: {
  //       type: "string",
  //       required: false,
  //       description: "Search term to filter activities by name",
  //     },
  //   },
  activity: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/activity-service/activity/{activityId}",
    description: "Returns detailed information about a specific activity.",
    ignore: ["splitSummaries"],

    params: {
      activityId: {
        type: "number",
        description: "Activity ID",
      },
    },
  },
  splits: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/activity-service/activity/{activityId}/splits",
    description: "Returns lap/split data for an activity.",
    ignore: ["startLatitude","startLongitude", "eventDTOs"],

    params: {
      activityId: {
        type: "number",
        description: "Activity ID",
      },
    },
  },
};
