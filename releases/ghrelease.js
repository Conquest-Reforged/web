class ReleaseSection {
  constructor(user, repo, containerId) {
    this.user = user;
    this.repo = repo;
    this.containerId = id;
    this.title = (div, release) => {
      div.innerText = `Latest: ${release.version}`;
    };
    this.button = (div, asset) => {
      div.innerText = `${asset.name} (${asset.downloadCount} downloads)`;
    };
  }

  load() {
    let container = document.getElementById(this.containerId);
    if (container === undefined) {
      console.warn('Container "', this.containerId, '" not found!');
      return;
    }

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
    };

    request.send();
  }
}
