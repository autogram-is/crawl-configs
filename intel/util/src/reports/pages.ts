import { ArangoDB } from "../arango.js";
import { aql } from "arangojs";
import jetpack from "fs-jetpack";

const db = new ArangoDB();

const dir = jetpack.dir('../output');

const query = aql`
  for p in pages
  return {
      url: p.url,
      section: p.hcr,
      status: p.status.code,
      title: p.title,
      created: p.date.created,
      modified: p.date.modified,
      owner: p.owner.primary,
      template: p.template,
      type: p.tags.emtcontenttype[0],
      types: LENGTH(p.tags.emtcontenttype),
      subject: p.tags.emtsubject[0],
      subjects: LENGTH(p.tags.emtsubject),
      audience: p.tags.emtaudience[0],
      audiences: LENGTH(p.tags.emtaudience)
  }
`;

await db.query(query)
  .then(cursor => cursor.all())
