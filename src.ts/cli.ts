import yargs from "yargs";

import { pokePipCommand, pokePepCommand } from "./actions";
import { migrateCommand } from "./migrate";

yargs
  .command(migrateCommand)
  .command(pokePipCommand)
  .command(pokePepCommand)
  .demandCommand(1, "Choose a command from the above list")
  .help().argv;
