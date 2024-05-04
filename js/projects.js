// Get project popups
const blog = document.querySelector(".blog-pu");
const portfolio = document.querySelector(".portfolio-pu");
const ambient = document.querySelector(".ambient-pu");
const mixtorrents = document.querySelector(".mixtorrents-pu");

// Get projects buttons
const btnBlog = document.querySelectorAll(".blog-btn");
const btnPortfolio = document.querySelectorAll(".portfolio-btn");
const btnAmbient = document.querySelectorAll(".ambient-btn");
const btnMixtorrents = document.querySelectorAll(".mixtorrents-btn");

// Get project videos
const portfolioVid = document.querySelector(".portfolio-vid");
const blogVid = document.querySelector(".blog-vid");
const ambientVid = document.querySelector(".ambient-vid");
const mixtorrentsVid = document.querySelector(".mixtorrents-vid");

// For the open and close buttons, open or close the project popup
btnBlog.forEach(btn => {
    btn.addEventListener("click", () => {
        blog.classList.toggle("blog-pu--active");
        if (blogVid.paused) {
            blogVid.play();
        } else {
            blogVid.pause();
        }
    });
});

btnPortfolio.forEach(btn => {
    btn.addEventListener("click", () => {
        portfolio.classList.toggle("portfolio-pu--active");
        if (portfolioVid.paused) {
            portfolioVid.play();
        } else {
            portfolioVid.pause();
        }
    });
});

btnAmbient.forEach(btn => {
    btn.addEventListener("click", () => {
        ambient.classList.toggle("ambient-pu--active");
        if (ambientVid.paused) {
            ambientVid.play();
        } else {
            ambientVid.pause();
        }
    });
});

btnMixtorrents.forEach(btn => {
    btn.addEventListener("click", () => {
        mixtorrents.classList.toggle("mixtorrents-pu--active");
        if (mixtorrentsVid.paused) {
            mixtorrentsVid.play();
        } else {
            mixtorrentsVid.pause();
        }
    });
});

// Close any open popup on click of the window
window.addEventListener('click', function (event) {
    if (!(event.target.closest(".portfolio-btn")) && !(event.target.closest(".portfolio-pu"))) {
        if (portfolio.classList.contains("portfolio-pu--active")) {
            portfolio.classList.toggle("portfolio-pu--active");
            portfolioVid.pause();
        }
    }

    if (!(event.target.closest(".ambient-btn")) && !(event.target.closest(".ambient-pu"))) {
        if (ambient.classList.contains("ambient-pu--active")) {
            ambient.classList.toggle("ambient-pu--active");
            ambientVid.pause();
        }
    }

    if (!(event.target.closest(".blog-btn")) && !(event.target.closest(".blog-pu"))) {
        if (blog.classList.contains("blog-pu--active")) {
            blog.classList.toggle("blog-pu--active");
            blodVid.pause();
        }
    }

    if (!(event.target.closest(".mixtorrents-btn")) && !(event.target.closest(".mixtorrents-pu"))) {
        if (mixtorrents.classList.contains("mixtorrents-pu--active")) {
            mixtorrents.classList.toggle("mixtorrents-pu--active");
            mixtorrentsVid.pause();
        }
    }
});