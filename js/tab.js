$(function() {
    $("#goodClass").on("click", "dd", function() {
        $("dd").removeClass("current");
        $(this).addClass("current");
        $("#goodClass div.good-panel").hide();
        $("#goodClass div.good-panel").eq($(this).index()).show();
        return false
    });
    $("#goodPanel").on("click", "p", function() {
        $(".sport-class p").removeClass("onclick");
        $(this).addClass("onclick");
        $("#goodClass div.p-class").hide();
        $("#goodClass div.p-class").eq($(this).index()).show();
        return false
    });

    $("#brandLetter").on("click", "p", function() {
        $(".brand-letter p").removeClass("pick");
        $(this).addClass("pick");
        $("#brandLetter div.letter-con").hide();
        $("#brandLetter div.letter-con").eq($(this).index()).show();
        return false
    });
});
