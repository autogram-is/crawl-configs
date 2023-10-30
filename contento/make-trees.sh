#! /bin/bash

spidergram url tree unique_urls --preset=collapse --filter="parsed.domain=appraisd.com" > output/appraised-tree.txt
spidergram url tree unique_urls --preset=collapse --filter="parsed.domain=intercom.com" > output/intercom-tree.txt
spidergram url tree unique_urls --preset=collapse --filter="parsed.domain=stripe.com" > output/stripe-tree.txt
spidergram url tree unique_urls --preset=collapse --filter="parsed.domain=webstacks.com" > output/webstacks-tree.txt
spidergram url tree unique_urls --preset=collapse --filter="parsed.domain=teamwork.com" > output/teamwork-tree.txt