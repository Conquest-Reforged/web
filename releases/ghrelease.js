class ReleaseSection {
  constructor(user, repo, containerId) {
    this.user = user;
    this.repo = repo;
    this.containerId = containerId;
    this.titleText = release => `Version: ${release.version}`;
    this.buttonText = asset => `${asset.name} (${asset.downloadCount} downloads)`;
  }

  createLoader() {
    let loader = this.make('div', 'release-loader');
    return loader;
  }

  createTitle(release) {
    let title = this.make('div', 'release-title');
    title.innerText = this.titleText(release);
    return title;
  }

  createButton(asset) {
    let container = this.make('div', 'button-container');
    let button = this.make('a', 'release-button');
    button.innerText = this.buttonText(asset);
    button.href = `${asset.download}`;
    container.appendChild(button);
    return container;
  }

  make(type) {
    let el = document.createElement(type);
    for (let i = 1; i < arguments.length; i++) {
      el.classList.add(arguments[i]);
    }
    return el;
  }

  clear(div) {
    while (div.hasChildNodes()) {
      div.removeChild(div.lastChild);
    }
  }

  load() {
    let container = document.getElementById(this.containerId);
    if (container === undefined) {
      console.warn('Container "', this.containerId, '" not found!');
      return;
    }

    let loader = this.createLoader();
    container.classList.add('release-container');
    container.appendChild(loader);

    let self = this;
    let request = new ReleaseRequest(this.user, this.repo);
    request.callback = release => {
      self.clear(container);

      let title = this.createTitle(release);
      if (title !== undefined) {
        container.appendChild(title);
      }

      release.assets.forEach(asset => {
        let button = this.createButton(asset);
        if (button !== undefined) {
          container.appendChild(button);
        }
      });
    };

    request.send();
  }
}

// user: String - the github username
// repo: String - the name of the github repository (owned by 'user')
// callback: function(Release) - the callback that accepts the retrieved Release object
class ReleaseRequest {
  constructor(user, repo) {
    this.user = user;
    this.repo = repo;
    this.callback = release => {};
  }

  send() {
    let callback = this.callback;
    let request = new XMLHttpRequest();
    let query = `https://api.github.com/repos/${this.user}/${this.repo}/releases/latest`;

    request.onload = function() {
      if (this.readyState === 4 && this.status === 200) {
        let json = JSON.parse(this.responseText);
        return callback(parseRelease(json));
      }
    };

    request.open("GET", query);
    request.send();
  }
}

// user: String - the github username
// repo: String - the name of the github repository (owned by 'user')
// callback: function(Release) - the callback that accepts an array of Release objects
class ReleasesRequest {
  constructor(user, repo) {
    this.user = user;
    this.repo = repo;
    this.callback = release => {};
  }

  send() {
    let callback = this.callback;
    let request = new XMLHttpRequest();
    let query = `https://api.github.com/repos/${this.user}/${this.repo}/releases`;

    request.onload = function() {
      if (this.readyState === 4 && this.status === 200) {
        let json = JSON.parse(this.responseText);
        let releases = [];
        for (let i = 0; i < json.length; i++) {
          releases.push(parseRelease(json[i]));
        }
        callback(releases);
      }
    };

    request.open("GET", query);
    request.send();
  }
}

function getDownloadTotals(user, repo, callback) {
  let result = {};
  let request = new ReleasesRequest(user, repo);
  request.callback = function(releases) {
    for (let i = 0; i < releases.length; i++) {
      let release = releases[i];
      for (let j = 0; j < release.assets.length; j++) {
        let asset = release.assets[j];
        let name = asset.name.endsWith(".exe") ? "exe" : "jar";
        let count = result[name] || 0;
        result[name] = count + asset.downloadCount;
      }
    }
    callback(result);
  };
  request.send();
}

function parseRelease(release) {
  let date = release['published_at'];
  let version = release['tag_name'];
  let assets = [];
  let assetsRaw = release['assets'];
  for (let i = 0; i < assetsRaw.length; i++) {
    assets.push(parseAsset(assetsRaw[i]));
  }
  return new Release(date, version, assets);
}

function parseAsset(asset) {
  let name = asset['name'];
  let download = asset['browser_download_url'];
  let downloadCount = asset['download_count'];
  return new Asset(name, download, downloadCount);
}

// version: String - the version/tag of the Release
// date: String - the date the Release was published
// assets: Asset[] - an array of Assets attached to this Release
class Release {
  constructor(date, version, assets) {
    this.version = version;
    this.date = date;
    this.assets = assets;
  }
}

// name: String - name of the asset
// download: String - download url of the asset
// downloadCount: Number - number of times downloaded
class Asset {
  constructor(name, url, count) {
    this.name = name;
    this.download = url;
    this.downloadCount = count;
  }
}
