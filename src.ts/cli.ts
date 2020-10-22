import yargs from "yargs";

import { pokePipCommand, configPipCommand, pokePepCommand } from "./actions";
import { migrateCommand } from "./migrate";

yargs
  .command(configPipCommand)
  .command(migrateCommand)
  .command(pokePepCommand)
  .command(pokePipCommand)
  .demandCommand(1, "Choose a command from the above list")
  .help().argv;
