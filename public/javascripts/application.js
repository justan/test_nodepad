$('.destroy').live('click', function(e) {
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
(function comet(){
  $.ajax({
    url: '/comet',
    type: 'json',
    success: function(data){
      
      comet();
    },
    error: function(){
      setTimeout(function(){comet()}, 3000);
    }
  });
 })();