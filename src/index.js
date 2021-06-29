const pcsclite = require("pcsclite");

function main() {
  const readers = [];
  const pcsc = pcsclite()
    .on("error", (err) => {
      console.log("error", err);
    })
    .on("reader", (reader) => {
      console.log("info", "Initialize new reader", {
        reader: reader.name,
      });
      readers.push(reader);
      let atr;
      reader.state = 0;
      reader.on("error", (err) => {
        console.log("error", err);
      });
      reader.on("status", (status) => {
        // console.log("----name:'%s' atr:%s reader_state:%s state:%s", reader.name, status.atr.toString("hex"), reader.state, status.state);
        // check what has changed
        const changes = (reader.state || 0) ^ status.state;
        if (changes) {
          if ((changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY)) {
            // card removed
            if (atr) {
              // don't fire event if 'atr' wasn't set
              const event = {
                reader,
                atr,
              };
              console.log("remove", event);
              atr = null;
            }
          } else if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
            // card insert
            const event = {
              reader,
            };
            if (status.atr && status.atr.byteLength) {
              atr = status.atr;
              event.atr = atr;
            }
            console.log("info", "New token was added to the reader", {
              reader: reader.name,
              atr: atr?.toString("hex") || "unknown",
            });
            // Delay for lib loading
            setTimeout(() => {
              console.log("insert", event);
            }, 1e3);
          }
        }
      });

      reader.on("end", () => {
        if (atr) {
          // don't fire event if 'atr' wasn't set

          console.log("info", "Token was removed from the reader", {
            reader: reader.name,
            atr: atr?.toString("hex") || "unknown",
          });

          const event = {
            reader,
            atr,
          };
          console.log("remove", event);
          atr = null;
        }
      });
    });
}

main();