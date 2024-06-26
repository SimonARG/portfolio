// Get project popups
const blog = document.querySelector('.blog-pu');
const portfolio = document.querySelector('.portfolio-pu');
const ambient = document.querySelector('.ambient-pu');
const mixtorrents = document.querySelector('.mixtorrents-pu');
const mpi = document.querySelector('.mpi-pu');
const newtab = document.querySelector('.newtab-pu');

// Get projects buttons
const btnBlog = document.querySelectorAll('.blog-btn');
const btnPortfolio = document.querySelectorAll('.portfolio-btn');
const btnAmbient = document.querySelectorAll('.ambient-btn');
const btnMixtorrents = document.querySelectorAll('.mixtorrents-btn');
const btnMpi = document.querySelectorAll('.mpi-btn');
const btnNewtab = document.querySelectorAll('.newtab-btn');

// Get project videos
const portfolioVid = document.querySelector('.portfolio-vid');
const blogVid = document.querySelector('.blog-vid');
const ambientVid = document.querySelector('.ambient-vid');
const mixtorrentsVid = document.querySelector('.mixtorrents-vid');
const mpiVid = document.querySelector('.mpi-vid');
const newtabVid = document.querySelector('.newtab-vid');

// For the open and close buttons, open or close the project popup
const toggleProjectPopup = (project, vid) => {
  project.classList.toggle('active');

  if (vid.paused) {
    vid.play();
  } else {
    vid.pause();
  }
}

btnBlog.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(blog, blogVid)
  });
});

btnPortfolio.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(portfolio, portfolioVid)
  });
});

btnAmbient.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(ambient, ambientVid)
  });
});

btnMixtorrents.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(mixtorrents, mixtorrentsVid)
  });
});

btnNewtab.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(newtab, newtabVid)
  });
});

btnMpi.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleProjectPopup(mpi, mpiVid)
  });
});

// Close any open popup on click of the window
const projectRollover = (event, button, popupEl, popup, vid) => {
  if (!(event.target.closest(button)) && !(event.target.closest(popupEl))) {
    if (popup.classList.contains('active')) {
      popup.classList.toggle('active');
      vid.pause();
    }
  }
}

window.addEventListener('click', function (event) {
  projectRollover(event, '.portfolio-btn', '.portfolio-pu', portfolio, portfolioVid);

  projectRollover(event, '.ambient-btn', '.ambient-pu', ambient, ambientVid);

  projectRollover(event, '.mixtorrents-btn', '.mixtorrents-pu', mixtorrents, mixtorrentsVid);

  projectRollover(event, '.blog-btn', '.blog-pu', blog, blogVid);

  projectRollover(event, '.mpi-btn', '.mpi-pu', mpi, mpiVid);

  projectRollover(event, '.newtab-btn', '.newtab-pu', newtab, newtabVid);
});