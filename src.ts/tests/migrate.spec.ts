import { migrate} from "../actions";

import { alice } from "./constants";
import { expect, getTestAddressBook } from "./utils";

describe.only("cli migrate", () => {
  it("should run without error", async () => {
    await expect(migrate(alice, await getTestAddressBook())).to.be.fulfilled;
  });
});
