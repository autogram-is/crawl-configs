# Crawl Configs

This repository is a collection of Spidergram configurations for various crawling projects. Anyone at Autogram is welcome to tinker with it, add new examples, and so on.

## Setting up Spidergram

1. Node.js (`brew install node; brew install nvm; nvm install latest; nvm default latest`)
2. Containerized ArangoDB (`brew install docker docker-compose`)
3. Spidergram proper (`npm install -g spidergram`)
4. Gin

## Setting up a crawl

This repository is set up to ignore the `storage` and `output` directories that Spidergram uses to store crawled data, downloaded files, and generated reports. It also ignores any files named `arango.config.*`, so you can stick database credentials there if you're not using a local docker container.

This setup also means you can run crawls in these directories without worrying that gigs of data will accidentally get checked into the repository.

### Accessing a shared crawl

- Get the DB credentials
- Get the storage archive

### Running a local crawl

- Starting Arango in Docker


## The crawl list

- WIAD: World IA Day. Around 3000 pages total, with its blog hanging out on a separate Medium.com account.
- Schwab: 
- VA: 
- ULI: The Urban Land Institute, with piles of local and SIG subsites and high profile magazine site used as a hub.