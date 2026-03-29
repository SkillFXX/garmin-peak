export const api = {
  profile: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/userprofile-service/userprofile/personal-information/{uuid}",
    description: "Returns user profile information.",
    params: {
      uuid: {
        type: "string",
        description: "User UUID",
      },
    },
    response: {
      userInfo: {
        birthDate: "string (YYYY-MM-DD)",
        genderType: "string ('MALE' or 'FEMALE')",
        email: "string",
        locale: "string (e.g., 'en')",
        timeZone: "string (e.g., 'America/Los_Angeles')",
        age: "number (years)",
        countryCode: "string (e.g., 'US')",
      },
      biometricProfile: {
        userId: "number",
        height: "number (cm)",
        weight: "number (g)",
        vo2Max: "number (ml/kg/min)",
        vo2MaxCycling: "number (ml/kg/min)",
        vo2MaxRowing: "number (ml/kg/min)",
        lactateThresholdHeartRate: "number (bpm)",
      },
    },
  },
  predictions: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/metrics-service/metrics/racepredictions/latest/{uuid}",
    description: "Returns latest user race predictions.",
    params: {
      uuid: {
        type: "string",
        description: "User UUID",
      },
    },
    respone: {
      userId: "number",
      time5K: "number (s)",
      time10K: "number (s)",
      timeHalfMarathon: "number (s)",
      timeMarathon: "number (s)",
    },
  },
  sleep: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/sleep-service/sleep/dailySleepData",
    description: "Returns weather details of a specific activity.",
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
    response: {
      dailySleepDTO: {
        id: "number",
        userProfilePK: "number",
        calendarDate: "string (YYYY-MM-DD)",

        sleepTimeSeconds: "number (s)",
        napTimeSeconds: "number (s)",

        sleepStartTimestampGMT: "number (ms)",
        sleepEndTimestampGMT: "number (ms)",
        sleepStartTimestampLocal: "number (ms)",
        sleepEndTimestampLocal: "number (ms)",

        deepSleepSeconds: "number (s)",
        lightSleepSeconds: "number (s)",
        remSleepSeconds: "number (s)",
        awakeSleepSeconds: "number (s)",

        averageSpO2Value: "number (%)",
        lowestSpO2Value: "number (%)",
        highestSpO2Value: "number (%)",

        averageRespirationValue: "number (breaths/min)",
        lowestRespirationValue: "number",
        highestRespirationValue: "number",

        avgHeartRate: "number (bpm)",
        avgSleepStress: "number",

        awakeCount: "number",

        sleepWindowConfirmed: "boolean",
        sleepWindowConfirmationType: "string",

        deviceRemCapable: "boolean",
        sleepFromDevice: "boolean",

        sleepScoreFeedback: "string",
        sleepScoreInsight: "string",
        sleepScorePersonalizedInsight: "string",

        sleepScores: {
          totalDuration: {
            qualifierKey: "string",
            optimalStart: "number (s)",
            optimalEnd: "number (s)",
          },
          stress: {
            qualifierKey: "string",
            optimalStart: "number",
            optimalEnd: "number",
          },
          awakeCount: {
            qualifierKey: "string",
            optimalStart: "number",
            optimalEnd: "number",
          },
          overall: {
            value: "number",
            qualifierKey: "string",
          },
          remPercentage: {
            value: "number (%)",
            qualifierKey: "string",
          },
          restlessness: {
            qualifierKey: "string",
          },
          lightPercentage: {
            value: "number (%)",
            qualifierKey: "string",
          },
          deepPercentage: {
            value: "number (%)",
            qualifierKey: "string",
          },
        },

        sleepNeed: {
          baseline: "number (min)",
          actual: "number (min)",
          feedback: "string",
          trainingFeedback: "string",
          sleepHistoryAdjustment: "string",
          hrvAdjustment: "string",
          napAdjustment: "string",
          timestampGmt: "string (ISO date)",
        },

        nextSleepNeed: {
          baseline: "number (min)",
          actual: "number (min)",
          feedback: "string",
          trainingFeedback: "string",
          sleepHistoryAdjustment: "string",
          hrvAdjustment: "string",
          napAdjustment: "string",
          timestampGmt: "string (ISO date)",
        },
      },
    },
  },
  summary: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/usersummary-service/usersummary/daily/{uuid}",
    description:
      "Returns a summary of user's health and activity data for the day (stress, steps, battery level, etc.)",
    params: {
      uuid: {
        type: "string",
        description: "User UUID",
      },
    },
    query: {
      calendarDate: {
        type: "string (YYYY-MM-DD)",
        required: true,
        description: "Date of the summary",
      },
    },
    response: {
      userProfileId: "number",
      totalKilocalories: "number (kcal)",
      activeKilocalories: "number (kcal)",
      bmrKilocalories: "number (kcal)",
      remainingKilocalories: "number (kcal)",

      totalSteps: "number",
      totalDistanceMeters: "number (m)",

      dailyStepGoal: "number",
      netCalorieGoal: "number",

      highlyActiveSeconds: "number (s)",
      activeSeconds: "number (s)",
      sedentarySeconds: "number (s)",
      sleepingSeconds: "number (s)",

      durationInMilliseconds: "number (ms)",

      moderateIntensityMinutes: "number (min)",
      vigorousIntensityMinutes: "number (min)",

      floorsAscended: "number",
      floorsDescended: "number",

      minHeartRate: "number (bpm)",
      maxHeartRate: "number (bpm)",
      restingHeartRate: "number (bpm)",

      stress: {
        averageStressLevel: "number",
        maxStressLevel: "number",
        stressDuration: "number (s)",
        restStressDuration: "number (s)",
        activityStressDuration: "number (s)",
        stressPercentage: "number (%)",
        stressQualifier: "string",
      },

      bodyBattery: {
        chargedValue: "number",
        drainedValue: "number",
        highestValue: "number",
        lowestValue: "number",
        mostRecentValue: "number",
      },

      spo2: {
        average: "number (%)",
        lowest: "number (%)",
        latest: "number (%)",
      },

      respiration: {
        avgWakingRespirationValue: "number (breaths/min)",
        highestRespirationValue: "number",
        lowestRespirationValue: "number",
        latestRespirationValue: "number",
      },

      calendarDate: "string (YYYY-MM-DD)",
      lastSyncTimestampGMT: "string (ISO date)",

      includesWellnessData: "boolean",
      includesActivityData: "boolean",

      source: "string",

      bodyBatteryActivityEventList: [
        {
          eventType: "string",
          eventStartTimeGmt: "string (ISO date)",
          durationInMilliseconds: "number (ms)",
          bodyBatteryImpact: "number",
          activityName: "string | null",
          activityType: "string | null",
          activityId: "number | null",
        },
      ],
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
    response: {
      temp: "number (Fahrenheit)",
      dewPoint: "number",
      relativeHumidity: "number (%)",
      windDirection: "number (degres)",
      windSpeed: "number (knot)",
      weatherStationDTO: {
        name: "string",
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
    response: [
      {
        gearPk: "number (id of the gear)",
        gearModelName: "string ",
        gearTypeName: "string (e.g., 'bike', 'shoes')",
        gearStatusName: "string",
        displayName: "string",
        customMakeModel: "string",
      },
    ],
  },
  activities: {
    method: "GET",
    url: "https://connect.garmin.com/gc-api/activitylist-service/activities/search/activities",
    description: "Returns a list of all activities.",
    query: {
      limit: {
        type: "number",
        required: true,
        description: "Limit of listed activities",
      },
      start: {
        type: "number",
        required: true,
        description: "Start of the listed activities",
      },
      activityType: {
        type: "string",
        required: false,
        description: "Filter by activity type (e.g., 'running')",
      },
      search: {
        type: "string",
        required: false,
        description: "Search term to filter activities by name",
      }
    },
    response: [
      {
        activityId: "number",
        activityName: "string",
        startTimeLocal: "string (format YYYY-MM-DD HH:mm:ss)",
        startTimeGMT: "string (format YYYY-MM-DD HH:mm:ss)",

        activityType: {
          typeKey: "string (e.g., 'running')",
        },

        summaryDTO: {
          distance: "number (m)",
          duration: "number (s)",
          movingDuration: "number (s)",

          elevationGain: "number (m)",
          elevationLoss: "number (m)",

          averageSpeed: "number (m/s)",
          maxSpeed: "number (m/s)",

          calories: "number",

          averageHR: "number (bpm)",
          maxHR: "number (bpm)",

          steps: "number",

          avgPower: "number (W)",
          maxPower: "number (W)",

          avgRunningCadence: "number (spm)",
          maxRunningCadence: "number (spm)",

          strideLength: "number (cm)",
          verticalOscillation: "number (mm)",
          verticalRatio: "number (%)",

          vO2Max: "number",

          trainingEffect: "number",
          trainingEffectLabel: "string",

          aerobicTrainingEffect: "number",
          anaerobicTrainingEffect: "number",

          avgGradeAdjustedSpeed: "number (m/s)",

          hrTimeInZone: {
            zone1: "number (s)",
            zone2: "number (s)",
            zone3: "number (s)",
            zone4: "number (s)",
            zone5: "number (s)",
          },

          powerTimeInZone: {
            zone1: "number (s)",
            zone2: "number (s)",
            zone3: "number (s)",
            zone4: "number (s)",
            zone5: "number (s)",
          },

          fastestSplits: {
            "1000m": "number (s)",
            "1609m": "number (s)",
            "5000m": "number (s)",
            "10000m": "number (s)",
          },

          differenceBodyBattery: "number",
          activityTrainingLoad: "number",

          minTemperature: "number (°C)",
          maxTemperature: "number (°C)",

          minElevation: "number (m)",
          maxElevation: "number (m)",
        },

        location: {
          latitude: "number",
          longitude: "number",
        },

        endTimeGMT: "string (format YYYY-MM-DD HH:mm:ss)",

        owner: {
          ownerId: "number",
          ownerFullName: "string",
        },

        deviceId: "number",
        manufacturer: "string (e.g., 'GARMIN')",

        lapCount: "number",

        hasSplits: "boolean",
        hasPolyline: "boolean",
      },
    ],
    activity: {
      method: "GET",
      url: "https://connect.garmin.com/gc-api/activity-service/activity/{activityId}",
      description: "Returns detailed information about a specific activity.",

      params: {
        activityId: {
          type: "number",
          description: "Activity ID",
        },
      },

      response: {
        activityId: "number",
        activityUUID: "string (uuid)",
        activityName: "string",
        userProfileId: "number",
        isMultiSportParent: "boolean",
        activityTypeDTO: {
          typeKey: "string (e.g., 'running')",
        },
        eventTypeDTO: {
          typeKey: "string (e.g., 'race')",
        },
        accessControlRuleDTO: {
          typeKey: "string (e.g., 'public')",
        },
        timeZoneUnitDTO: {
          timeZone: "string (e.g., 'Europe/Paris')",
        },
        metadataDTO: {
          lastUpdateDate: "string (ISO 8601)",
          uploadedDate: "string (ISO 8601)",
          hasPolyline: "boolean",
          hasChartData: "boolean",
          hasHrTimeInZones: "boolean",
          hasPowerTimeInZones: "boolean",
          hasSplits: "boolean",
          lapCount: "number",
          manufacturer: "string (e.g., 'GARMIN')",
          deviceMetaDataDTO: {
            deviceId: "string",
          },

          personalRecord: "boolean",

          manualActivity: "boolean",
          favorite: "boolean",
          trimmed: "boolean",
          elevationCorrected: "boolean",
          autoCalcCalories: "boolean",
        },

        summaryDTO: {
          startTimeLocal: "string (ISO 8601)",
          startTimeGMT: "string (ISO 8601)",

          startLatitude: "number",
          startLongitude: "number",

          endLatitude: "number",
          endLongitude: "number",

          locationName: "string",

          distance: "number (m)",
          duration: "number (s)",
          movingDuration: "number (s)",
          elapsedDuration: "number (s)",

          elevationGain: "number (m)",
          elevationLoss: "number (m)",
          maxElevation: "number (m)",
          minElevation: "number (m)",
          avgElevation: "number (m)",

          averageSpeed: "number (m/s)",
          averageMovingSpeed: "number (m/s)",
          maxSpeed: "number (m/s)",

          calories: "number",
          bmrCalories: "number",

          averageHR: "number (bpm)",
          maxHR: "number (bpm)",
          minHR: "number (bpm)",

          averageRunCadence: "number (spm)",
          maxRunCadence: "number (spm)",

          averagePower: "number (W)",
          maxPower: "number (W)",
          minPower: "number (W)",
          normalizedPower: "number (W)",
          totalWork: "number (kJ)",

          groundContactTime: "number (ms)",
          strideLength: "number (cm)",
          verticalOscillation: "number (mm)",
          verticalRatio: "number (%)",

          trainingEffect: "number",
          anaerobicTrainingEffect: "number",
          trainingEffectLabel: "string (e.g., 'VO2MAX')",

          aerobicTrainingEffectMessage: "string",
          anaerobicTrainingEffectMessage: "string",

          activityTrainingLoad: "number",

          avgGradeAdjustedSpeed: "number (m/s)",

          maxVerticalSpeed: "number (m/s)",

          waterEstimated: "number (ml)",

          directWorkoutFeel: "number (0-100)",
          directWorkoutRpe: "number (0-100)",

          moderateIntensityMinutes: "number",
          vigorousIntensityMinutes: "number",

          steps: "number",

          recoveryHeartRate: "number",

          differenceBodyBattery: "number",
        },

        locationName: "string",
      },
    },
    splits: {
      method: "GET",
      url: "https://connect.garmin.com/gc-api/activity/{activityId}/splits",
      description: "Returns lap/split data for an activity.",

      params: {
        activityId: {
          type: "number",
          description: "Activity ID",
        },
      },

      response: {
        activityId: "number",
        lapDTOs: [
          {
            distance: "number (m)",
            duration: "number (s)",
            movingDuration: "number (s)",
            elevationGain: "number (m)",
            elevationLoss: "number (m)",
            averageSpeed: "number (m/s)",
            maxSpeed: "number (m/s)",
            calories: "number",
            averageHR: "number (bpm)",
            maxHR: "number (bpm)",
            averageRunCadence: "number (spm)",
            maxRunCadence: "number (spm)",
            averagePower: "number (W)",
            maxPower: "number (W)",
            groundContactTime: "number (ms)",
            strideLength: "number (m)",
            verticalOscillation: "number (cm)",
            verticalRatio: "number (%)",
          },
        ],
      },
    },
  },
};
