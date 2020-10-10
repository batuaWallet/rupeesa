import yargs, { Argv } from "yargs";

import { migrate } from "./migrate";

export const migrateCommand = {
  command: "migrate",
  describe: "Migrate contracts",
  builder: (yargs: Argv): Argv => {
    return yargs
      .option("a", {
        alias: "address-book",
        description: "The path to your address book file",
        type: "string",
        default: "./address-book.json",
      })
      .option("m", {
        alias: "mnemonic",
        description: "The mnemonic for an account which will pay for gas",
        type: "string",
        default: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
      })
      .option("p", {
        alias: "eth-provider",
        description: "The URL of an Ethereum provider",
        type: "string",
        default: "http://localhost:8545",
      });
  },
  handler: async (argv: { [key: string]: any } & Argv["argv"]): Promise<void> => {
    await migrate(argv.ethProvider, argv.mnemonic, argv.addressBook);
  },
};

yargs
  .command(migrateCommand)
  .demandCommand(1, "Choose a command from the above list")
  .help().argv;
