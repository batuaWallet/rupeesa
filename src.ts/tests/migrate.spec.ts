import { migrate} from "../migrate";

import { alice } from "./constants";
import { expect, getTestAddressBook } from "./utils";

describe("cli migrate", () => {
  it("should run without error", async () => {
    await expect(migrate(alice, await getTestAddressBook())).to.be.fulfilled;
  });
});
