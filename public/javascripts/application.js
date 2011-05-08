(function($){
var $del;

// $('#tabs').tabs({
  // ajaxOptions:{
    // error: function(xhr, status, index, anchor){
      // $(anchor.hash).html('load data failed')
    // },
    // success: function(data){
      // ;
    // }
  // }
// });

$del = $('.destroy').live('click', function(e) {
  e.preventDefault();
  var that = this;
  if (confirm('Are you sure you want to delete that item?')) {
    $.ajax({
      url: '/documents/' + $(that).parent('li')[0].id.replace(/^list_/, ''),
      type: 'post',
      data: {'_method': 'delete'},
      success: function(d){
        $(that.parentNode).remove();
      },
      error: function(){
        alert('error');
      }
    });
  }
});

$('.title').live('click', function(){
	var that = this;
	$.ajax({
        url: '/documents/' + $(that).parent('li')[0].id.replace(/^list_/, '') + '.json',
		success: function(d){
			alert(d.data);
		},
		error: function(){
			;
		}
	});
});

$('.logout').live('click', function(e) {
  //e.preventDefault();
  $.ajax({
    url: '/sessions',
    type: 'post',
    data: {'_method': 'delete'},
    success: function(d){
      ;
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