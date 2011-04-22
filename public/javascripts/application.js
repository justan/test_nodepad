$('.destroy').live('click', function(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to delete that item?')) {
    var element = $(this),
        form = $('<form></form>');
    form
      .attr({
        method: 'POST',
        action: '/documents/' + element.val()
      })
      .hide()
      .append('<input type="hidden" name="_method" value="delete"/>');
      //form.submit();
	  
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