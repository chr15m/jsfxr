var test = require("tape");
var j = require("./sfxr");

test('test converting values from sliders to domain and back again', async function (t) {
  const keys = Object.keys(j.convert.sliders);
  for (k in j.convert.sliders) {
  //for (k in {"p_lpf_freq": true}) {
    let tolerance = 0.0001;
    // if (["p_arp_speed", "p_repeat_speed"].indexOf(k) != -1) continue;
    // special case these because the rounding in the slider conversion destroys information
    if (["p_arp_speed", "p_repeat_speed"].indexOf(k) != -1) tolerance = 0.004;
    const start = j.parameters.signed.indexOf(k) == -1 ? 0 : -1;
    const table = [];
    for (i=start; i<=1; i+=0.01) {
      const r1 = j.convert.sliders[k](i);
      const r2 = j.convert.domain[k](r1);
      const r3 = j.convert.domain_inverse[k](r2);
      const r4 = j.convert.sliders_inverse[k](r3);
      table[i] = {"slider": r1, "slider_inv": j.convert.sliders_inverse[k](r1), "domain": r2, "domain_inv": r3, "round_trip": r4};
      //console.log(i, r1, j.convert.sliders_inverse[k](r1), r2, r3, r4);
      var pass = Math.abs(i - r4) < tolerance;
      if (!pass) {
        console.table(table);
      }
      t.ok(pass, k + " at " + i + " =~ " + r4);
      if (!pass) {
        process.exit();
      }
    }
    console.table(table);
  }
});
