const database = require('../../config/database');

const dbService = (environment, migrate) => {
  const authenticateDB = () => (
    database
      .authenticate()
  );

  // const dropDB = () => (
  //   database
  //     .drop()
  // );

  const syncDB = () => (
    database
      .sync()
  );

  const successfulDBStart = () => (
    console.info('connection to the database has been established successfully')
  );

  const errorDBStart = (err) => (
    console.info('unable to connect to the database:', err)
  );

  const wrongEnvironment = () => {
    console.warn(`only development, staging, test and production are valid NODE_ENV variables but ${environment} is specified`);
    return process.exit(1);
  };

  const startMigrateTrue = () => (
    syncDB()
      .then(() => successfulDBStart())
      .catch((err) => errorDBStart(err))
  );

  const startMigrateFalse = () => (
    dropDB()
      .then(() => (
        syncDB()
          .then(() => successfulDBStart())
          .catch((err) => errorDBStart(err))
      )
        .catch((err) => errorDBStart(err)),
    )
  );

  const startDev = () => (
    authenticateDB()
      .then(() => {
        if (migrate) {
          return startMigrateTrue();
        }

        return startMigrateFalse();
      })
  );

  const startDB = () => {
    authenticateDB()
      .then(() => startMigrateTrue())
  }

  const startStage = () => (
    authenticateDB()
      .then(() => {
        if (migrate) {
          return startMigrateTrue();
        }

        return startMigrateFalse();
      })
  );

  const startTest = () => (
    authenticateDB()
      .then(() => startMigrateFalse())
  );

  const startProd = () => (
    authenticateDB()
      .then(() => startMigrateFalse())
  );

  const start = () => {
    switch (environment) {
      case 'development':
        return startDB();
      case 'staging':
        return startDB();
      case 'testing':
        return startDB();
      case 'production':
        return startDB();
      default:
        return wrongEnvironment();
    }
  };

  return {
    start,
  };
};

module.exports = dbService;
