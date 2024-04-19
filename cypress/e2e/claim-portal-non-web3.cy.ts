/* eslint-disable sonarjs/no-duplicate-string */
describe("Claims Portal Non-Web3", () => {
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();

    setupIntercepts();

    cy.visit(`/${claimUrl}`);
    cy.wait(2000);
  });

  describe("No window.ethereum", () => {
    it("Should toast and hide buttons in a non-web3 env", () => {
      cy.get("#invalidator").should("not.be.visible");
      cy.get("#claim-loader").should("not.be.visible");
      cy.get("#view-claim").should("not.be.visible");

      cy.get("body", { timeout: 3000 }).should("contain.text", "Please use a web3 enabled browser to collect this reward.");
    });
  });

  describe("Mobile: No window.ethereum", () => {
    beforeEach(() => {
      cy.viewport("iphone-6");
      cy.reload();
    });

    it("Should toast and hide buttons in a non-web3 env", () => {
      cy.get("#invalidator").should("not.be.visible");
      cy.get("#claim-loader").should("not.be.visible");
      cy.get("#view-claim").should("not.be.visible");

      cy.get("body", { timeout: 3000 }).should("contain.text", "Please use a web3 enabled browser to collect this reward.");
    });
  });
});

function setupIntercepts() {
  cy.intercept("POST", "*", (req) => {
    // return a 404 for rpc optimization meaning no successful RPC
    // to return our balanceOf and allowance calls
    if (req.body.method === "eth_getBlockByNumber") {
      req.reply({
        statusCode: 404,
        body: {
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Method not found",
          },
          id: 1,
        },
      });
    }
  });

  cy.intercept("POST", "https://gnxgtwvmduxcwucovxqp.supabase.co/rest/v1/*", {
    statusCode: 200,
    body: {},
  });
  cy.intercept("PATCH", "https://gnxgtwvmduxcwucovxqp.supabase.co/rest/v1/*", {
    statusCode: 200,
    body: {},
  });
  cy.intercept("GET", "https://gnxgtwvmduxcwucovxqp.supabase.co/rest/v1/*", {
    statusCode: 200,
    body: {},
  });
}

// placed here due to length
const claimUrl =
  "?claim=W3sidHlwZSI6ImVyYzIwLXBlcm1pdCIsInBlcm1pdCI6eyJwZXJtaXR0ZWQiOnsidG9rZW4iOiIweGU5MUQxNTNFMGI0MTUxOEEyQ2U4RGQzRDc5NDRGYTg2MzQ2M2E5N2QiLCJhbW91bnQiOiIxMDAwMDAwMDAwMDAwMDAwMCJ9LCJub25jZSI6IjEwODc2OTM3ODM4MTQ4OTY1NTIxMDM2ODQ4NzgzNzgzMDA2MDU0MjAwMzcxOTM0NTY0MzYzMjQ5MDIzMTQ1MTcyOTczMTgzNDgwMTM5MiIsImRlYWRsaW5lIjoiMTE1NzkyMDg5MjM3MzE2MTk1NDIzNTcwOTg1MDA4Njg3OTA3ODUzMjY5OTg0NjY1NjQwNTY0MDM5NDU3NTg0MDA3OTEzMTI5NjM5OTM1In0sInRyYW5zZmVyRGV0YWlscyI6eyJ0byI6IjB4ZjM5RmQ2ZTUxYWFkODhGNkY0Y2U2YUI4ODI3Mjc5Y2ZmRmI5MjI2NiIsInJlcXVlc3RlZEFtb3VudCI6IjEwMDAwMDAwMDAwMDAwMDAwIn0sIm93bmVyIjoiMHg3MDk5Nzk3MEM1MTgxMmRjM0EwMTBDN2QwMWI1MGUwZDE3ZGM3OUM4Iiwic2lnbmF0dXJlIjoiMHg4YWZmYWU1ZTA5YTkyN2QwYjUzNDQ1M2Y4NTE5ZWVlZDE5MzY5MTBkZWFhOGY5YTA0OTM1ODQzNDMzNDA5NmExMTg5ZmVkM2MxNzgyZmU0ZGI5ZTNhMDg2NWVkYjc3ZDczYzliMDliOTgxMTBmN2Q0ZWEyY2Y5ZDBhM2Q1YjhjYzFjIiwibmV0d29ya0lkIjozMTMzN30seyJ0eXBlIjoiZXJjMjAtcGVybWl0IiwicGVybWl0Ijp7InBlcm1pdHRlZCI6eyJ0b2tlbiI6IjB4ZTkxRDE1M0UwYjQxNTE4QTJDZThEZDNENzk0NEZhODYzNDYzYTk3ZCIsImFtb3VudCI6IjkwMDAwMDAwMDAwMDAwMDAwMDAifSwibm9uY2UiOiI1NjQzNjc4ODI2MzUwOTQ3NTY2NzAwNzA4MDA5ODQ5MDM0MDE1OTExMzYxMjM5NTUyMTA3Mjk3NDkxNzcyNDA2Mzg0NDY2Mjc0NDEzMiIsImRlYWRsaW5lIjoiMTE1NzkyMDg5MjM3MzE2MTk1NDIzNTcwOTg1MDA4Njg3OTA3ODUzMjY5OTg0NjY1NjQwNTY0MDM5NDU3NTg0MDA3OTEzMTI5NjM5OTM1In0sInRyYW5zZmVyRGV0YWlscyI6eyJ0byI6IjB4ZjM5RmQ2ZTUxYWFkODhGNkY0Y2U2YUI4ODI3Mjc5Y2ZmRmI5MjI2NiIsInJlcXVlc3RlZEFtb3VudCI6IjkwMDAwMDAwMDAwMDAwMDAwMDAifSwib3duZXIiOiIweDcwOTk3OTcwQzUxODEyZGMzQTAxMEM3ZDAxYjUwZTBkMTdkYzc5QzgiLCJzaWduYXR1cmUiOiIweDhhZmZhZTVlMDlhOTI3ZDBiNTM0NDUzZjg1MTllZWVkMTkzNjkxMGRlYWE4ZjlhMDQ5MzU4NDM0MzM0MDk2YTExODlmZWQzYzE3ODJmZTRkYjllM2EwODY1ZWRiNzdkNzNjOWIwOWI5ODExMGY3ZDRlYTJjZjlkMGEzZDViOGNjMWMiLCJuZXR3b3JrSWQiOjMxMzM3fV0=";
