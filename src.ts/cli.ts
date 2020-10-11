import yargs, { Argv } from "yargs";

import { migrateCommand } from "./actions/migrate";

yargs
  .command(migrateCommand)
  .demandCommand(1, "Choose a command from the above list")
  .help().argv;
