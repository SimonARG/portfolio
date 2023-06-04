$(document).ready(function(){

    var inlineWordContainer = document.querySelectorAll(".inline-word-container"),
    inlineWordChildren = document.querySelectorAll(".inline-word > div");

    inlineWordContainer.forEach(function(container) {

        container.addEventListener("mouseenter", function() {

            container.classList.add("inline-word-container--active");

            inlineWordChildren.forEach(function(children) {

                setTimeout(function() 
                {
                    container.classList.remove("inline-word-container--active");
                }, 1600);

            });

        });

    });

    var inlineWordContainer = document.querySelectorAll(".inline-word-container"),
    inlineWordChildren = document.querySelectorAll(".inline-word-jp > div");

    inlineWordContainer.forEach(function(container) {

        container.addEventListener("mouseenter", function() {

            container.classList.add("inline-word-container--active");

            inlineWordChildren.forEach(function(children) {

                setTimeout(function()
                {
                    container.classList.remove("inline-word-container--active");
                }, 1600);

            });

        });

    });

    var aboutShow = false;
    var socialsShow = false;

    $(".left-bar-about").click(function() {

        if (socialsShow == true) {

            $("#socials").hide("fold", 318);
            socialsShow = false;

        }

        if (aboutShow == false) {

            $("#about").show("fold", 318);
            aboutShow = true;

        } else {

            $("#about").hide("fold", 318);
            aboutShow = false;

        }

    })

    $(".left-bar-socials").click(function() {

        if (aboutShow == true) {

            $("#about").hide("fold", 318);
            aboutShow = false;

        }

        if (socialsShow == false) {

            $("#socials").show("fold", 318);
            socialsShow = true;

        } else {

            $("#socials").hide("fold", 318);
            socialsShow = false;

        }

    })

    $(".about-closer").click(function() {

        $("#about").hide("fold", 318);
        aboutShow = false;

    });

    $(".socials-closer").click(function() {

        $("#socials").hide("fold", 318);
        socialsShow = false;

    });


});