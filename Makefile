install: install-deps

develop:
	npx webpack-dev-server

install-deps:
	npm install

build:
	rm -rf dist
	NODE_ENV=production npx webpack

lint:
	npx eslint .

publish:
	npm publish