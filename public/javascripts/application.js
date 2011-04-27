(function($){
var $del = $('.destroy').live('click', function(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to delete that item?')) {
    $.ajax({
      url: '/documents/' + this.value,
      type: 'post',
      data: {'_method': 'delete'},
      success: function(d){
        ;
      },
      error: function(){
        alert('error')
      }
    });
  }
});

$('.logout').live('click', function(e) {
  e.preventDefault();
    $.ajax({
      url: '/sessions',
      type: 'post',
      data: {'_method': 'delete'},
      success: function(d){
        alert('log out success');
      },
      error: function(){
        alert('error')
      }
    });
});

setTimeout(function comet(){
  $.ajax({
    url: '/comet',
    type: 'get',
	dataType: 'json',
    success: function(data){
      console.log("1234")
      //comet();
    },
    error: function(){
      setTimeout(function(){comet()}, 3000);
    }
  });
}, 3000);

//ui
$del.button()


})(jQuery);