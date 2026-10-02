// =============================================================================
// Suits Made Simple — image generation
//
// Renders the full catalog imagery: editorial portraits of distinguished Black
// Nigerian men in their forties and older, lifestyle frames, fabric detail
// shots, and the hero slideshow.
//
// Uses the free, keyless Pollinations image endpoint.
//
//   node scripts/generate-images.mjs                 # generate anything missing
//   node scripts/generate-images.mjs --force         # regenerate everything
//   node scripts/generate-images.mjs --only hero     # only matching targets
//   node scripts/generate-images.mjs --reprocess     # re-run sharp, no downloads
//   node scripts/generate-images.mjs --no-details    # skip the fabric macros
//
// Raw downloads are cached in `.cache/raw/`, so reprocessing (crop, upscale,
// sharpen) is free and instant once an image has been fetched.
//
// Note: the endpoint caps output at roughly 0.59 MP, so clarity is recovered
// locally by cropping the edges and upscaling with Lanczos.
// =============================================================================

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ENDPOINT = "https://image.pollinations.ai/prompt/";
const MODEL = process.env.POLLINATIONS_MODEL ?? "flux";
const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, ".cache", "raw");
const PUBLIC_DIR = path.join(ROOT, "public");
// The endpoint rate-limits hard, so the retry backoff below paces requests;
// an extra fixed delay would only slow the run down.
const REQUEST_DELAY_MS = 0;

/**
 * Prompt hardening. Diffusion models like to paint fake lettering and logos,
 * which read as watermarks; this suppresses them explicitly.
 *
 * The model reads a negative-style clause like this as a description of what
 * the frame contains, so it is written as a list of absences and paired with a
 * positive demand for plain surfaces.
 */
const NO_MARKINGS =
  "no text anywhere in the image, no lettering, no words, no captions, " +
  "no logos, no brand marks, no labels, no product tags, no care labels, " +
  "no badges, no emblems, no crests, no signage, no posters, no wall art, " +
  "no framed pictures, no notices, no certificates, no menus, no book spines, " +
  "no screens or monitors, no watermarks, no signatures, no photographer credit, " +
  "no borders, no frames, no ui overlays, " +
  "every surface plainly textured and free of any writing, " +
  "plain unmarked fabric with no visible branding";

/** Keeps the stage uncluttered so there is nothing for the model to letter. */
const CLEAN_BACKDROP =
  "clean uncluttered background, plain unadorned surfaces, no decor, " +
  "nothing hanging on the walls, empty space, simple composition";

const HOUSE_STYLE =
  "premium editorial menswear photography, refined muted colour grade, " +
  "medium format camera, shallow depth of field, crisp fabric texture, " +
  "photorealistic, ultra detailed, high-end fashion catalogue";

/** Varying the men keeps the collection from looking like one repeated face. */
const SUBJECTS = [
  "a distinguished Nigerian businessman in his late forties with a close-cropped grey-flecked beard",
  "a mature Nigerian man in his early fifties with greying temples and a calm authoritative expression",
  "a distinguished Nigerian gentleman in his mid fifties with salt-and-pepper hair and a neatly trimmed beard",
  "a Nigerian man in his late forties, bald with a trimmed beard and rimless glasses",
  "an elegant Nigerian man in his late fifties with silver hair and a dignified bearing",
  "a Nigerian pastor in his fifties with a warm composed expression and a short grey beard",
];

/**
 * Names the appearance explicitly. Left to "Nigerian man" alone the model drifts
 * towards a generic African-American look, so the features are stated outright.
 */
const NIGERIAN_LOOK =
  "an authentic Nigerian man of West African heritage, rich deep brown skin, " +
  "West African facial features and bone structure, natural dark complexion " +
  "with warm undertones, textured short black hair";

/** One entry per suit, carrying its own settings and fabric language. */
const SUITS = [
  {
    slug: "executive-charcoal",
    garment: "an impeccably tailored deep charcoal wool two-piece suit, crisp white shirt and burgundy silk tie",
    fabric: "charcoal Super 120s wool",
    lobby: "in a modern glass office lobby",
    alt: "on a broad stone staircase",
    life: "walking through a sunlit corporate atrium",
    seed: 5100,
  },
  {
    slug: "boardroom-navy",
    garment: "a midnight navy three-piece suit with matching waistcoat, starched white shirt and silver tie",
    fabric: "midnight navy Super 130s wool",
    lobby: "in an elegant dark panelled boardroom",
    alt: "in a classic library with leather chairs",
    life: "standing at the head of a long conference table",
    seed: 5200,
  },
  {
    slug: "ambassador-midnight",
    garment: "a black tuxedo with satin shawl lapel, black bow tie and pleated dress shirt",
    fabric: "black wool with a satin shawl lapel",
    lobby: "in a softly lit luxury hotel lobby at night",
    alt: "beneath the arches of a grand opera house",
    life: "arriving at an evening gala",
    seed: 5300,
  },
  {
    slug: "chancellor-pinstripe",
    garment: "a chalk pinstripe charcoal wool two-piece suit, white shirt and deep red tie",
    fabric: "chalk pinstripe wool",
    lobby: "in a classic panelled study",
    alt: "beside a tall city window",
    life: "stepping from a black saloon car onto a city street",
    seed: 5400,
  },
  {
    slug: "shepherds-grey",
    garment: "a soft-shouldered light grey wool blazer over a fine knit polo and tailored trousers",
    fabric: "light grey wool-linen blend",
    lobby: "in a bright minimalist room with linen textures",
    alt: "in a bright church vestibule",
    life: "greeting a congregation at the door of a sanctuary",
    seed: 5500,
  },
  {
    slug: "vineyard-linen",
    garment: "a warm sand beige linen suit with a white open-collar shirt",
    fabric: "warm sand Irish linen",
    lobby: "on a sunlit stone terrace with olive trees",
    alt: "on a shaded coastal veranda",
    life: "walking outdoors in golden late afternoon light",
    seed: 5600,
  },
  {
    slug: "retreat-knit",
    garment: "a muted sage green knitted blazer over a white shirt and tailored grey trousers",
    fabric: "muted sage Italian knit jersey",
    lobby: "in a calm contemporary lounge",
    alt: "in a quiet study beside a window",
    life: "seated reading in a relaxed lounge",
    seed: 5700,
  },
  {
    slug: "sabbath-ivory",
    garment: "an ivory cream dinner jacket with a shawl collar, black trousers and black bow tie",
    fabric: "ivory wool-silk blend with covered buttons",
    lobby: "in a warmly lit formal hall",
    alt: "in a candlelit sanctuary",
    life: "presiding over an evening ceremony",
    seed: 5800,
  },
];

/** Hero slideshow: one portrait per slide, rotating behind the headline. */
const HERO_SEEDS = [6001, 6002, 6003, 6004, 6005];

/**
 * Hero settings are deliberately bare: the earlier settings borrowed a study
 * and a library for texture, and the model filled them with legible books and
 * framed documents. Plain stages give it nothing to letter.
 */
const HERO_SETTINGS = [
  "against a plain seamless studio backdrop with a soft falloff",
  "in an empty bright room with bare plaster walls",
  "upon a plain unadorned stone terrace in soft daylight",
  "against a smooth plain wall in a quiet unlit room",
  "in a bare minimalist setting with a single plain backdrop panel",
];

function buildTargets() {
  const targets = [];

  SUITS.forEach((suit, index) => {
    // Frames of the same suit deliberately use different men, so the collection
    // reads as a wardrobe rather than one repeated face.
    const portrait = SUBJECTS[index % SUBJECTS.length];
    const alternate = SUBJECTS[(index + 3) % SUBJECTS.length];
    const lifestyle = SUBJECTS[(index + 1) % SUBJECTS.length];

    targets.push({
      name: `${suit.slug}`,
      out: `products/${suit.slug}.jpg`,
      aspect: "portrait",
      seed: suit.seed + 1,
      subject: portrait,
      prompt: `wearing ${suit.garment}, standing ${suit.lobby}, three-quarter length, soft directional studio lighting, ${CLEAN_BACKDROP}`,
    });
    targets.push({
      name: `${suit.slug}-alt`,
      out: `products/${suit.slug}-alt.jpg`,
      aspect: "portrait",
      seed: suit.seed + 2,
      subject: alternate,
      prompt: `wearing ${suit.garment}, standing ${suit.alt}, three-quarter length, natural side light, ${CLEAN_BACKDROP}`,
    });
    targets.push({
      name: `${suit.slug}-life`,
      out: `products/${suit.slug}-life.jpg`,
      aspect: "landscape",
      seed: suit.seed + 3,
      subject: lifestyle,
      prompt: `wearing ${suit.garment}, ${suit.life}, candid editorial moment, cinematic lighting, ${CLEAN_BACKDROP}`,
    });
    targets.push({
      name: `${suit.slug}-detail`,
      out: `products/${suit.slug}-detail.jpg`,
      aspect: "square",
      seed: suit.seed + 4,
      prompt: `extreme macro close-up of ${suit.fabric}, showing weave, lapel and stitching detail, studio lighting, shallow depth of field, absolutely no text or labels or brand marks anywhere in frame`,
    });
  });

  HERO_SEEDS.forEach((seed, index) => {
    const subject = SUBJECTS[(index + 1) % SUBJECTS.length];
    const suit = SUITS[(index + 2) % SUITS.length];
    targets.push({
      name: `hero-${index + 1}`,
      out: `hero/hero-${index + 1}.jpg`,
      aspect: "portrait",
      seed,
      subject,
      prompt: `wearing ${suit.garment}, standing ${HERO_SETTINGS[index % HERO_SETTINGS.length]}, calm confident expression, half length, soft even studio lighting, generous negative space, ${CLEAN_BACKDROP}`,
    });
  });

  return targets;
}

/** Requested source dimensions per aspect (the endpoint caps the real output). */
const REQUEST = {
  portrait: { width: 1024, height: 1280 },
  landscape: { width: 1280, height: 854 },
  square: { width: 900, height: 900 },
};

/** Final delivered dimensions after cropping and upscaling. */
const OUTPUT = {
  portrait: { width: 1100, height: 1375 },
  landscape: { width: 1400, height: 934 },
  square: { width: 1100, height: 1100 },
};

/** Edge inset, as a share of the short side, to drop painted-on corner marks. */
const CROP_INSET = 0.045;

async function download(target) {
  const { width, height } = REQUEST[target.aspect];
  // Only face-forward frames name the man; the fabric macros must not.
  const look = target.subject ? `${target.subject}, ${NIGERIAN_LOOK}, ` : "";
  const url = new URL(
    ENDPOINT + encodeURIComponent(`${look}${target.prompt}, ${HOUSE_STYLE}, ${NO_MARKINGS}`)
  );
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("model", MODEL);
  url.searchParams.set("nologo", "true");
  url.searchParams.set("seed", String(target.seed));

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: "image/jpeg,image/*" },
        signal: AbortSignal.timeout(180_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (bytes.byteLength < 15_000) throw new Error(`too small (${bytes.byteLength} bytes)`);
      if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) throw new Error("not a JPEG");

      await mkdir(RAW_DIR, { recursive: true });
      await writeFile(path.join(RAW_DIR, `${target.name}.jpg`), bytes);
      return bytes.byteLength;
    } catch (error) {
      if (attempt === 6) throw error;
      const wait = 6000 * attempt;
      process.stdout.write(`\n    attempt ${attempt} failed (${error.message}); retry in ${wait / 1000}s `);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  return 0;
}

async function renderTarget(target) {
  const raw = await readFile(path.join(RAW_DIR, `${target.name}.jpg`));
  const { width, height } = await sharp(raw).metadata();
  const inset = Math.round(Math.min(width, height) * CROP_INSET);

  const out = path.join(PUBLIC_DIR, target.out);
  await mkdir(path.dirname(out), { recursive: true });

  const info = await sharp(raw)
    .extract({
      left: inset,
      top: inset,
      width: width - inset * 2,
      height: height - inset * 2,
    })
    .resize(OUTPUT[target.aspect].width, OUTPUT[target.aspect].height, {
      fit: "cover",
      kernel: "lanczos3",
    })
    .sharpen({ sigma: 1.2, m1: 0.5, m2: 1.8 })
    .modulate({ saturation: 1.03 })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(out);

  return info.size;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const reprocess = args.includes("--reprocess");
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex >= 0 ? args[onlyIndex + 1]?.split(",") : null;

  const noDetails = args.includes("--no-details");
  const failed = [];

  let targets = buildTargets();
  if (only) targets = targets.filter((t) => only.some((key) => t.name === key || t.name.startsWith(key)));
  // Fabric macros carry no faces, so `--no-details` skips them when only the
  // modelling changes.
  if (noDetails) targets = targets.filter((t) => !t.name.endsWith("-detail"));

  if (targets.length === 0) {
    console.error("No targets matched.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `${targets.length} target(s), model "${MODEL}"${force ? ", force" : ""}${reprocess ? ", reprocess" : ""}${
      noDetails ? ", no details" : ""
    }.`
  );

  for (const [index, target] of targets.entries()) {
    const label = `[${index + 1}/${targets.length}] ${target.out}`;
    const rawPath = path.join(RAW_DIR, `${target.name}.jpg`);

    let haveRaw = false;
    if (!force) {
      try {
        await readFile(rawPath);
        haveRaw = true;
      } catch {
        haveRaw = false;
      }
    }

    process.stdout.write(`  ${label} ... `);

    // The free endpoint throttles unpredictably, so one bad frame must never
    // abort the batch — log it, move on, and report it at the end.
    try {
      if (!haveRaw && !reprocess) {
        await download(target);
        process.stdout.write("fetched, ");
        if (index < targets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
        }
      }
      const size = await renderTarget(target);
      console.log(`processed (${Math.round(size / 1024)} KB)`);
    } catch (error) {
      failed.push(target.out);
      console.log(`SKIPPED (${error.message})`);
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
    console.log(`\n${failed.length} target(s) still missing — re-run to fetch them:`);
    for (const out of failed) console.log(`  ${out}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
