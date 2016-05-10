$(".icon-save , .icon-cancel").hide();

$(document).ready(function(){
  
  $('input').focus(function(){
    $('input').parent().removeClass("focus");
    $(this).parent().toggleClass( "focus" );
    $(this).siblings().children(".icon-edit, .icon-add").fadeOut(20);
    $(this).siblings().children(".icon-cancel").delay(200).fadeIn(100);
  });
  
  if( $("input#test_mobile_user").val() === "" ){
    $("input#test_mobile_user").siblings().children(".icon-edit").hide();
    
  } else {
    $("input#test_mobile_user").siblings().children(".icon-add").hide();
  }
  
  if ( $("input#test_mobile_pw").val() === "" ){
    $("input#test_mobile_pw").siblings().children(".icon-edit").hide();
  } else {
    $("input#test_mobile_pw").siblings().children(".icon-add").hide();
  }
  
  $("input").keyup(function(){
    $(this).siblings().children('.icon-cancel').fadeOut("fast");
    $(this).siblings().children('.icon-save').delay(200).fadeIn("fast");
  });
  
  $('.icon-edit, .icon-add').on("click",function(){
    event.preventDefault();
    $(this).parent().siblings("input").focus();
    $(this).closest("div").parent().addClass("focus");
    $(this).siblings(".icon-cancel").delay(200).fadeIn(100);
  });
  
  $('.icon-save, .icon-cancel').on("click",function(){
    event.preventDefault();
    $(this).fadeOut("fast", function(){
      if( $(this).parent().siblings("input").val() === "" ){
        $(this).siblings(".icon-add").fadeIn("fast");
      } else {
        $(this).siblings(".icon-edit").fadeIn("fast");
      }
    });
  });
  
  $(this).click(function (e) {
    if( ($(".input-wrapper").is(".focus") && !$("input, .icon-edit, .icon-add").is(e.target)) ) {
      $(".focus").removeClass("focus");
    }
  });
  
});
