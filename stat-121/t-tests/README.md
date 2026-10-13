# From Samples to t Scores

Open `/stat-121/t-tests/` on the site, or serve the repository root locally and open that path. The lab is a static HTML/CSS/JavaScript app with no build step.

Both populations are normal and sampled independently. For each sample of size `n`, the app computes the sample mean `ȳ`, sample standard deviation `s` with divisor `n − 1`, and `t = (ȳ − μ₀) / (s / √n)`. The null reference curve is Student t with `n − 1` degrees of freedom. Alternative samples use their own `μ₁` and `σ₁` for drawing, but are tested against `μ₀`. Each empirical histogram is normalized by its own number of samples.

Changing a population parameter or `n` clears earlier samples, so different settings are never mixed in one histogram. Up to 3,000 recent samples per population are retained. Run the statistical checks with `node --test stat-121/t-tests/stats.test.mjs`.
