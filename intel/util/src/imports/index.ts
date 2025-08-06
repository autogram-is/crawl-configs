import { PageImport } from "./pages.js";
import { PageViews } from "./pageviews.js";
import { TagImport } from "./tags.js";
import { TaxonomyImport } from "./taxonomy.js";

await new TaxonomyImport().run();
await new TagImport().run();
await new PageViews().run();
await new PageImport().run();

