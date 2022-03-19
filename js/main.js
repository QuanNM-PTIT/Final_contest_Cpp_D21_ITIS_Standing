/**
 *  main.js
 */


// Vuejs
function vuejs() {
      
    var RANKS_KEY = 'icpc-ranks';
    var OPER_FLAG_KEY = 'operation-flag';

    var OPEN_DELAY_TIME = 0; //闪烁时间
    var ROLLING_TIME = 1000; //排名上升时间
    window.Storage = {
        fetch: function(type) {
            if(type == 'ranks')
                return JSON.parse(localStorage.getItem(RANKS_KEY)) || window.resolver.rank_frozen;
            else if(type == 'opera_flag')
                return localStorage.getItem(OPER_FLAG_KEY) || 0;
        },

        update: function(type, data) {
            if(type == 'ranks')
                localStorage.setItem(RANKS_KEY, JSON.stringify(data));
            else if(type == 'opera_flag')
                localStorage.setItem(OPER_FLAG_KEY, data);
        }
    };

    window.Operation = {
        next: async function() {
            vm.$data.op_status = false;
            var op = vm.$data.operations[vm.$data.op_flag];
            var op_length = vm.$data.operations.length - 1;
            if(vm.$data.op_flag < op_length)
                var op_next = vm.$data.operations[vm.$data.op_flag+1];
            console.log(op);
            var ranks = vm.$data.ranks;
            var rank_old = ranks[op.old_rank];

            var el_old = $('#rank-' + op.old_rank);
            var el_new = $('#rank-' + op.new_rank);


            // Flash
            el_old
                .find('.p-'+op.problem_index).addClass('flash')
                .find('.p-content').addClass('flash');
            await sleep(2 * 500);
            el_old
                .find('.p-'+op.problem_index).removeClass('flash')
                .find('.p-content').removeClass('flash')

            // Rotate
            el_old
                .find('.p-'+op.problem_index).addClass('uncover')
                .find('.p-content').addClass('uncover');
            await sleep(parseInt(op.frozen_submissions) * 600);
            el_old
                .find('.p-'+op.problem_index).removeClass('uncover')
                .find('.p-content').removeClass('uncover');

            if(op.new_rank == op.old_rank){
                if(vm.$data.op_flag < op_length)
                    var el_old_next = $('#rank-' + op_next.old_rank);
                setTimeout(function(){ 
                    var ver = op.new_verdict;
                    if(ver == 'AC'){
                        num = 100;
                        var ver2 = op.old_verdict;
                        if (ver2[0] == 'P') {
                            var num2 = parseInt(ver2.substring(1, ver2.length));
                            num -= num2;
                        }
                        rank_old.score += num;
                        //rank_old.penalty += op.new_penalty;
                        rank_old.problem[op.problem_index].old_penalty = op.new_penalty;
                    }else if (ver[0] == 'P') {
                        var num = parseInt(ver.substring(1, ver.length));
                        var ver2 = rank_old.problem[op.problem_index].old_verdict;
                        if (ver2[0] == 'P') {
                            var num2 = parseInt(ver2.substring(1, ver2.length));
                            var mx = max(num, num2);
                            op.new_verdict = "P" + mx.toString();
                            if (num > num2)
                                num -= num2;
                            else
                                num = 0;
                        }
                        console.log(num)
                        rank_old.score += num;
                    }
                    rank_old.problem[op.problem_index].old_verdict = op.new_verdict;
                    rank_old.problem[op.problem_index].new_verdict = "NA";
                    
                    //if(op.new_submissions > 0) {
                    if(op.new_verdict == 'AC'){
                        rank_old.problem[op.problem_index].old_submissions = op.new_submissions;
                        rank_old.problem[op.problem_index].frozen_submissions = 0;
                        rank_old.problem[op.problem_index].new_submissions = 0;
                    }
                    else {
                        rank_old.problem[op.problem_index].old_submissions +=  op.frozen_submissions;
                        rank_old.problem[op.problem_index].frozen_submissions = 0;
                        rank_old.problem[op.problem_index].new_submissions = 0;
                    }
                    Vue.nextTick(setRank);

                    setTimeout(function(){
                        vm.selected(el_old, 'remove');
                        if(vm.$data.op_flag < op_length)
                            vm.selected(el_old_next, 'add');
                        el_old.find('.p-'+op.problem_index).removeClass('uncover');
                        // vm.scrollToTop(op.old_rank, op_next.old_rank);
                        vm.$data.op_flag += 1;
                        vm.$data.op_status = true;
                    }, OPEN_DELAY_TIME + 100);
                }, OPEN_DELAY_TIME);
            }else{
                var old_pos_top = el_old.position().top;
                var new_pos_top = el_new.position().top;
                var distance = new_pos_top - old_pos_top;
                var win_heigth = $(window).height();
                if(Math.abs(distance) > win_heigth){
                    distance = -(win_heigth + 100);
                }
                var j = op.old_rank - 1;
                var el_obj = [];
                for(j; j >= op.new_rank; j--){
                    var el = $('#rank-'+ j);
                    el.rank_obj = ranks[j];
                    el_obj.push(el);
                }
                setTimeout(function(){
                    // return function(){
                        // 修改原始数据
                        var ver = op.new_verdict;
                        if(op.new_verdict == 'AC'){
                            num = 100;
                            var ver2 = op.old_verdict;
                            if (ver2[0] == 'P') {
                                var num2 = parseInt(ver2.substring(1, ver2.length));
                                num -= num2;
                            }
                            console.log(num)
                            rank_old.score += num;
                            rank_old.rank_show = op.new_rank_show;
                            console.log("new_rank_show" + op.new_rank_show);
                            //rank_old.penalty += op.new_penalty;
                            rank_old.problem[op.problem_index].old_penalty = op.new_penalty;
                        }else if (ver[0] == 'P') {
                            var num = parseInt(ver.substring(1, ver.length));
                            var ver2 = rank_old.problem[op.problem_index].old_verdict;
                            if (ver2[0] == 'P') {
                                var num2 = parseInt(ver2.substring(1, ver2.length));
                                var mx = max(num, num2);
                                op.new_verdict = "P" + mx.toString();
                                if (num > num2)
                                    num -= num2;
                                else
                                    num = 0;
                            }
                            console.log(num)
                            rank_old.score += num;
                        }
                        rank_old.problem[op.problem_index].old_verdict = op.new_verdict;
                        rank_old.problem[op.problem_index].new_verdict = "NA";
                        
                        //if(op.new_submissions > 0) {
                        if(op.new_verdict == 'AC'){
                            rank_old.problem[op.problem_index].old_submissions = op.new_submissions;
                            rank_old.problem[op.problem_index].frozen_submissions = 0;
                            rank_old.problem[op.problem_index].new_submissions = 0;
                        }
                        else {
                            rank_old.problem[op.problem_index].old_submissions +=  op.frozen_submissions;
                            rank_old.problem[op.problem_index].frozen_submissions = 0;
                            rank_old.problem[op.problem_index].new_submissions = 0;
                            //alert(rank_old.problem[op.problem_index].old_submissions);
                        }
                        //
                        Vue.nextTick(function(){
                            //添加揭晓题目闪动效果
                            //el_old
                                //.find('.p-'+op.problem_index).addClass('uncover')
                                //.find('.p-content').removeClass('uncover');
                            //修改排名
                            el_old.find('.rank').text(op.new_rank_show);
                            el_obj.forEach(function(val,i){ 
                                var dom_rank = el_obj[i].find('.rank');
                                var dom_rank_old = el_old.find('.rank');
                                if (dom_rank.text() !== "*" && dom_rank_old.text() !== "*") {
                                    var new_rank_show = Number(dom_rank.text())+1;
                                    dom_rank.text(new_rank_show);
                                    el_obj[i].rank_obj.rank_show = new_rank_show; 
                                }
                            });
                        });

                    setTimeout(function(){ 
                        el_old
                            .css('position', 'relative')
                            .animate({ top: distance+'px' }, ROLLING_TIME, function(){
                                el_new.removeAttr('style');
                                el_old.removeAttr('style');
                                var ranks_tmp = $.extend(true, [], ranks);
                                var data_old = ranks_tmp[op.old_rank];
                                var i = op.old_rank - 1;
                                for(i; i >= op.new_rank; i--){
                                    ranks_tmp[i+1] = ranks_tmp[i];
                                }
                                ranks_tmp[op.new_rank] = data_old;
                                vm.$set('ranks', ranks_tmp);

                                Vue.nextTick(function () {
                                    el_obj.forEach(function(val,i){ el_obj[i].removeAttr('style'); });
                                    el_old.find('.p-'+op.problem_index).removeClass('uncover');
                                    if(vm.$data.op_flag < op_length)
                                        var el_old_next = $('#rank-' + op_next.old_rank);
                                    vm.selected(el_old, 'remove');
                                    if(vm.$data.op_flag < op_length)
                                        vm.selected(el_old_next, 'add');
                                    // vm.scrollToTop(op.old_rank, op.new_rank);
                                    vm.$data.op_flag += 1;
                                    vm.$data.op_status = true;
                                });
                                Vue.nextTick(setRank);
                            });
                        for(var i = 0 ; i<el_obj.length ; ++i) {
                            if(106*(i-1)<=win_heigth){
                                el_obj[i].animate({'top': 106+'px'},ROLLING_TIME);
                            }
                            else {
                                el_obj[i].css({'top': 106+'px'});
                            }
                        }
                    }, OPEN_DELAY_TIME + 100);// two loop    

                    // };
                }, OPEN_DELAY_TIME);
            }
        },

        back: function() {

        }
    };
    
    Vue.filter('toMinutes', function (value) {
        return parseInt(value/60);
    });

    Vue.filter('problemStatus', function (problem) {
        return resolver.status(problem);
    });
    
    Vue.filter('submissions', function (problem) {
        var st = resolver.status(problem);
        if(st == 'ac')
            return 100;
        else if(st == 'frozen') {
            var ver = problem.old_verdict;
            var num = parseInt(ver.substring(1, ver.length));
            num = num.toString();
            if (isNaN(num))
                num = '0';
            return `${num}+[${problem.frozen_submissions}]`;
            return num + '+' + problem.frozen_submissions;
        }
        else if(st == 'failed') {
            var ver = problem.old_verdict;
            var num = parseInt(ver.substring(1, ver.length));
            return num;
        }
        else 
            return 'untouched';
        // todo
    });

    Vue.config.debug = true;

    window.vm = new Vue({
        el: '.app',

        data: {
            op_flag: Number(Storage.fetch('opera_flag')),
            op_status: true,  // running: false, stop: true
            p_count: resolver.problem_count,
            ranks: Storage.fetch('ranks'),
            //ranks: resolver.rank_frozen,
            operations: resolver.operations,
            users: resolver.users
        },

        ready: function () {
            this.$watch('ranks', function(ranks){
                Storage.update('ranks', ranks);
            }, {'deep': true});

            this.$watch('op_flag', function(op_flag){
                Storage.update('opera_flag', op_flag);
            }, {'deep': true});

            if(this.op_flag < this.operations.length){
                var op = this.operations[this.op_flag];
                this.selected($('#rank-'+op.old_rank), 'add');
            }
        },

        methods: {
            reset: function(){
                if(confirm('Reset standings?')){    
                    localStorage.clear();
                    window.location.reload();
                }
            },

            selected: function(el, type){
                if(type == 'add'){
                    el.addClass('selected');
                    // var win_heigth = $(window).height();
                    // var el_pos = el.position().top;
                    // var offset = el_pos - win_heigth + 261;
                    // window.scrollTo(0, offset);
                }else if(type == 'remove')
                    el.removeClass('selected');
                
            },

            // scrollToTop: function(old_rank, new_rank){
            //     var next_scrollY = -(new_rank * 75 + 52); // 75px: rank-item height; 52px: header
            //     scrollInterval = setInterval(function(){
            //         if (window.scrollY != next_scrollY) {
            //             window.scrollBy(0, -1);
            //         }
            //         else clearInterval(scrollInterval); 
            //     },30);

            // }

        }
    });
}

$.getJSON("contest.json", function(data){
    var resolver = new Resolver(data.solutions, data.users, data.problem_count, data.frozen_second);
    window.resolver = resolver;
    resolver.calcOperations();
    vuejs();

    // var el = $("#rank-0").position().top;
    // alert(el);
    // alert(window.scrollY);
    // alert($(document).height());
    // alert(document.body.clientHeight);

    document.onkeydown = function(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && e.keyCode == 37 /*&& vm.$data.op_status*/){ // key left
            Operation.back();
        }
        if(e && e.keyCode == 39 && vm.$data.op_status){ // key right
            var elem = document.getElementsByClassName("selected")[0];
            if (!isScrolledIntoView(elem))
                focusElement(elem);
            Operation.next();
        }
        if(e && e.keyCode == 13) {
            focusElement(document.getElementsByClassName("selected")[0]);
        }
    };
});

var focused = undefined;
function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function focusElement(elem) {
    elem.scrollIntoView({ behavior: 'smooth', block: 'end' });
    focused = elem;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function setRank() {
    // Same score => same rank
    var user_cnt = vm.$data.ranks.length;
    for (var i = 1; i < user_cnt; i++) {
        var now = $('#rank-'+ i.toString());
        var prev = $('#rank-'+ (i - 1).toString());
        if (now.find('.solved').text() == prev.find('.solved').text() && now.find('.penalty').text() == prev.find('.penalty').text()) {
            console.log(i);
            now.find('.rank').text(prev.find('.rank').text());
        }
    }
}
