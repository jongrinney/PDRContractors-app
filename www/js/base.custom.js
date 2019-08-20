cms.initForms = function(){
    var $formContainers = $('div[data-content^="forms|"]');
    $formContainers.each(function(){
        var $form = $(this);
        var id = $(this).attr('data-content').replace('forms|','');
        $form.find(':input[required]').attr('data-required',1);
        $.getJSON('/forms/'+id+'.json',function(data){
            $form.html('<form class="styledForm mostRecent" method="post" data-type="'+data.formType+'" data-cost="'+data.cost+data.defaultAmount+'"><input type="hidden" name="id" value="'+data.id+'">'+data.html+'</form>');
            $form.find('[disabled]').prop('disabled',false).trigger('change');
            $form.find(':input[required]').attr('data-required',1);
            $form.find(':input[required]:hidden').prop('required',false);
            $form.find('input[type="radio"][value="Other"]').change(function(){
                if($(this).is(':checked')){
                    $(this).next().find('span').hide();
                    $(this).next().find('input').show().css('height','auto').trigger('focus');
                }
            });
            $form.find('input[type="radio"][value="Other"]+label>input').keyup(function(){
                $(this).parent().prev().val($(this).val()).trigger('change')
            }).click(function(){
                $(this).parent().prev().prop('checked',true);
            });
                
            if(typeof cms.attachFormHandlers !== 'undefined')
                cms.attachFormHandlers();
                
            if(typeof lazyload !== 'undefined')
                lazyload.init();
        });
    });
};
cms.attachFormHandlers = function(processor){
    $('form.styledForm:not(.live):not([action])').attr('action','/cms/modules/forms/json/submitForm.php').attr('method','post')
    
    //calculate total price
    $('form:not(.live) :input').change(function(){
        var $form = $(this).closest('form');
        $.post('/cms/modules/forms/json/getFormPriceTotal.json.php',$form.serialize(),function(data){
            if(data.message=='good'){
                if(parseFloat(data.data.subtotal) == parseFloat(data.data.total)) $form.find('.priceTotal .subtotal').hide();
                else{
                    $form.find('.priceTotal .subtotal').show();
                    $form.find('.priceTotal .subtotal td').text(format_money(data.data.subtotal));
                }
                if(typeof data.data.discount === 'undefined' || (data.data.discount==0 && data.data.promocodeMessage==''))$form.find('.priceTotal .discount').hide();
                else {
                    $form.find('.priceTotal .discount').show();
                    if(data.data.discount!=0){
                        $form.find('.priceTotal .discount th').text('Discount');
                        $form.find('.priceTotal .discount td').html('-'+format_money(data.data.discount)+'<br><em>'+data.data.promocode.toUpperCase()+' - '+data.data.promocodeMessage+'</em>');
                    }
                    else{
                        $form.find('.priceTotal .discount th').text('Special Offer');
                        $form.find('.priceTotal .discount td').html('<em>'+data.data.promocode.toUpperCase()+' - '+data.data.promocodeMessage+'</em>');
                    }
                }
                if(data.data.tax==0) $form.find('.priceTotal .tax').hide();
                else {
                    $form.find('.priceTotal .tax').show();
                    $form.find('.priceTotal .tax td').text(format_money(data.data.tax));
                }
                $form.find('.priceTotal .total td').text(format_money(data.data.total));
                console.log(data);
                if($form.data('total') !== data.data.total){
                    $form.data('total', data.data.total);
                    $form.data('total',data.data.total).trigger('updateTotal');
                }
            }
        });
    });
    $('form:not(.live)').each(function(){
        $(this).find(':input').first().trigger('change');
    });
    //submit for forms that are not transactional
    if(typeof processor === 'undefined' || processor == ''){
        $('form.styledForm:not(.live)').addClass('live').attr('target','formSubmitter').unbind('submit').submit(function(){
            swal.showLoading();
            //check all required fields
            $(this).find(':input[data-required]').prop('required',true);
            $(this).find('.formStep').css('display','inline');
            if(!$(this).get(0).reportValidity()){
                $(this).find('.formStep').css('display','none').last().css('display','block');
                $(this).find(':input[data-required]:hidden').prop('required',false);
                return;
            }
            $(this).find('.formStep').css('display','none').last().css('display','block');
            $(this).find(':input[data-required]:hidden').prop('required',false);
            
            //pseudo ajax submit
            var $fb = $.fancybox.open({
                src: '<iframe name="formSubmitter" id="formSubmitter" style=" background: white; width: 90%; max-width: var(--page-max-width);">',
                type: 'html'
            });
            $fb.$refs.container.hide();
            $('#formSubmitter').data('$fb',$fb).data('formElem',this).unbind('load').on('load',function(){
                swal.hideLoading();
                var $fb = $('#formSubmitter').data('$fb');
                var formElem = $('#formSubmitter').data('formElem');
                var html =$('#formSubmitter').contents().text();
                if(html!=''){
                    try {
                        var data = JSON.parse(html);
                        $fb.close();
                        if(typeof data.code !== 'undefined' && data.code!='') {$.fancybox.close(); setTimeout(() => { $.fancybox.close(); /*eval(data.code)*/}, 1000);}
                        if(data.messageTitle != 'N/A'){
                            swal({
                                type: data.status,
                                title: data.messageTitle,
                                text: data.message
                            }).then(function(){
                                if(typeof data.link !== 'undefined' && data.link!='') window.location.href=data.link;
                                else if(typeof data.doRefresh !== 'undefined' && data.doRefresh)
                                    window.location.reload();
                            });
                        }
                        else {
                            if(typeof data.link !== 'undefined' && data.link!='') window.location.href=data.link;
                            else if(typeof data.doRefresh !== 'undefined' && data.doRefresh)
                                window.location.reload();
                        }
                        $(formElem).find(':input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"]):not([type="hidden"])').val(''); //formElem.reset();
                        $(formElem).find(':input[type="radio"], :input[type="checkbox"]').prop('checked',false); //formElem.reset();
                        
                    } catch (e) {
                        $fb.$refs.container.show();
                    }
                }
                else{
                    $fb.$refs.container.show();
                }
            });
        });
        $.getScript('https://pdrcontractors.com/cms/modules/forms/js/initializeFormsStep2.js.php');
    }
    
    $('a[href^="#cloneFields["]').unbind('click').click(function(e){
        var fields = $(this).attr('href').replace('#cloneFields[','').replace(']','').split(',');
        var $form = $(this).closest('form');
        for(var i in fields)
            $form.find('input[name="'+fields[i]+'[]"]').val($form.find('input[name="'+fields[i]+'[]"]').first().val());
        e.preventDefault();
        return false;
    });
    
    
    P.forms.ready(function(){
        initFormElements();
    });
    
    if(typeof initializeForms !== 'undefined')
        initializeForms();
}
