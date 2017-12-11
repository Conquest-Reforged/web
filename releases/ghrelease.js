class ReleaseSection {
  constructor(user, repo) {
    this.user = user;
    this.repo = repo;
    this.title = (div, release) => {
      div.innerText = `Latest: ${release.version}`;
    };
    this.button = (div, asset) => {
      div.innerText = `${asset.name} (${asset.downloadCount} downloads)`;
    };
  }

  load() {
    let containers = document.getElementsByClassName('release-container');
    if (containers === undefined || containers.length !== 1) {
      console.warn('Error, page should container 1 "release-container" div');
      return;
    }

    let container = containers[0];
    let request = new ReleaseRequest(this.user, this.repo);
    request.callback = release => {
      let titles = document.getElementsByClassName('release-title');
      if (titles !== undefined && titles.length === 1) {
        this.title(titles[0], release);
      }

      let links = document.createElement('div');
      release.assets.forEach(asset => {
        let link = document.createElement('a');
        link.classList.add('release-button');
        link.href = asset.download;
        this.button(link, asset);
        container.appendChild(link);
      });

      container.appendChild(links);
    };

    request.send();
  }
}

// user: String - the github username
// repo: String - the name of the github repository (owned by 'user')
// callback: function(Release) - the callback that accepts the retreived Release object
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
      if (this.readyState == 4 && this.status == 200) {
        let json = JSON.parse(this.responseText);
        let date = json['published_at'];
        let version = json['tag_name'];
        let assets = json['assets'];
        let results = [];

        for (let i = 0; i < assets.length; i++) {
          let asset = assets[i];
          let name = asset['name'];
          let download = asset['browser_download_url'];
          let downloadCount = asset['download_count'];
          results.push(new Asset(name, download, downloadCount));
        }

        let release = new Release(date, version, results);
        return callback(release);
      }
    };

    request.open("GET", query);
    request.send();
  }
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
