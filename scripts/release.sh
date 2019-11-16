# get current version from package.json
VER=$(cat package.json | grep version | cut -d " " -f 4 | tr -d "," | tr -d '"')

git config --local "action@github.com"
git config --local user.name "GitHub Action"
git commit -a -m "Auto Release v${VER} for updating ip data"
