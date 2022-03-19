function Resolver(solutions, users, problem_count, frozen_second){
	this.solutions = solutions;
	this.users = users;
	this.problem_count = problem_count;
	this.frozen_seconds = frozen_second;
	this.operations = [];
}

Resolver.prototype.status = function(problem) {
	if(problem.old_verdict == 'NA' && problem.new_verdict == 'NA')
		return "untouched";
	else if(problem.old_verdict == 'AC')
		return "ac";
	else if(problem.new_verdict == 'NA')
		return "failed";
	else 
		return "frozen";
}
function max(a, b) {
    return a > b ? a : b;
}
Resolver.prototype.calcOperations = async function() {
	this.rank = {};
	for(var solution_id in this.solutions) {
		var sol = this.solutions[solution_id];
		if(['WT', 'CE', 'VE', 'SE'].indexOf(sol.verdict) != -1) {
			continue;
		}
		if(Object.keys(this.rank).indexOf(sol.user_id) == -1) {
			this.rank[sol.user_id] = {'score':0, 'penalty':0, 'user_id':sol.user_id};
			this.rank[sol.user_id].problem = {};
			for(var i = 1; i <= this.problem_count; i++) {
				this.rank[sol.user_id].problem[i] = {
					'old_penalty':0,
					'new_penalty':0,
					'old_verdict':'NA',
					'new_verdict':'NA',
					'old_submissions':0,	//include the AC submission
					'frozen_submissions': 0,
					'new_submissions':0,
					'ac_penalty':0
				};
			}
		}
		
		if(this.rank[sol.user_id].problem[sol.problem_index].old_verdict=='AC') {
			continue;
		}
		if(sol.submitted_seconds <= this.frozen_seconds) {
            var ver = sol.verdict;
			if(ver == 'AC') {
				this.rank[sol.user_id].problem[sol.problem_index].old_submissions++;
				//this.rank[sol.user_id].problem[sol.problem_index].ac_penalty = sol.submitted_seconds;
				//this.rank[sol.user_id].problem[sol.problem_index].old_penalty = this.rank[sol.user_id].problem[sol.problem_index].ac_penalty + 20 * 60 * (this.rank[sol.user_id].problem[sol.problem_index].old_submissions - 1);
                var num = 100;

                ver = this.rank[sol.user_id].problem[sol.problem_index].old_verdict;
                if (ver[0] == 'P') {
                    var num2 = parseInt(ver.substring(1, ver.length));
                    num -= num2;
                }
				this.rank[sol.user_id].score += num;
				//this.rank[sol.user_id].penalty += this.rank[sol.user_id].problem[sol.problem_index].old_penalty;
            }else if (ver[0] == 'P') {
                var num = parseInt(ver.substring(1, ver.length));
                ver = this.rank[sol.user_id].problem[sol.problem_index].old_verdict;
                if (ver[0] == 'P') {
                    var num2 = parseInt(ver.substring(1, ver.length));
                    var mx = max(num, num2);
                    sol.verdict = String('P' + mx.toString());
                    if (num > num2)
                        num -= num2;
                    else
                        num = 0;
                }
                this.rank[sol.user_id].score += num;
            }else {
				this.rank[sol.user_id].problem[sol.problem_index].old_submissions++;
			}
			this.rank[sol.user_id].problem[sol.problem_index].old_verdict = sol.verdict;
		}
		else {    //after standings get frozen    
            if(this.rank[sol.user_id].problem[sol.problem_index].new_verdict=='AC') {
                this.rank[sol.user_id].problem[sol.problem_index].frozen_submissions++;
                continue;
            }
            if(sol.verdict == 'AC') {
                this.rank[sol.user_id].problem[sol.problem_index].new_verdict = sol.verdict;
                this.rank[sol.user_id].problem[sol.problem_index].frozen_submissions++;
                this.rank[sol.user_id].problem[sol.problem_index].new_submissions = this.rank[sol.user_id].problem[sol.problem_index].old_submissions + this.rank[sol.user_id].problem[sol.problem_index].frozen_submissions;
                //this.rank[sol.user_id].problem[sol.problem_index].ac_penalty = sol.submitted_seconds;
                this.rank[sol.user_id].problem[sol.problem_index].new_penalty = this.rank[sol.user_id].problem[sol.problem_index].ac_penalty + 20 * 60 * (this.rank[sol.user_id].problem[sol.problem_index].new_submissions - 1);
            }
            else {
                var old = this.rank[sol.user_id].problem[sol.problem_index].new_verdict;
                var tmp = sol.verdict;
                if (old[0] == 'P') {
                    var num1 = parseInt(old.substring(1, old.length));
                    var num2 = parseInt(sol.verdict.substring(1, sol.verdict.length));
                    var mx = max(num1, num2);
                    tmp = String('P' + mx.toString());
                }
                this.rank[sol.user_id].problem[sol.problem_index].new_verdict = tmp;
                this.rank[sol.user_id].problem[sol.problem_index].frozen_submissions++;
            }
        }
	}
	var uids = Object.keys(this.rank);
	this.rank2 = [];
	for(var key in uids) {
		var user_id = uids[key];
		this.rank2.push(this.rank[user_id]);
	}
	this.rank2.sort(function(a, b){
		if(a.score == b.score) {
			return a.penalty - b.penalty;
		}
		return b.score - a.score;
	});
	var rnk = 0;
	for (var i = 0; i < this.rank2.length; ++i) {
		var user_id = this.rank2[i].user_id;
		if (this.users[user_id].is_exclude === true) {
			this.rank2[i].rank_show = "*";
			this.rank[user_id].rank_show = "*";
		} else {
			rnk++;
			this.rank2[i].rank_show = rnk;
			this.rank[user_id].rank_show = rnk;
		}
	}
	//this.rank2.length = 200;
	this.rank_frozen = $.extend(true, [], this.rank2);
	for(var i = this.rank2.length - 1; i >= 0; i--) {
		var flag = true;
		while(flag) {
			flag = false;
			for(var j = 1; j <= this.problem_count; j++) {
				if(this.status(this.rank2[i].problem[j]) == "frozen") {
					flag = true;
					var op = {
						id: this.operations.length, 
						user_id: this.rank2[i].user_id,
						problem_index: j,
      					old_verdict: this.rank2[i].problem[j].old_verdict,
						new_verdict: this.rank2[i].problem[j].new_verdict,
						old_submissions: this.rank2[i].problem[j].old_submissions,
						frozen_submissions: this.rank2[i].problem[j].frozen_submissions,
						new_submissions: this.rank2[i].problem[j].new_submissions,
						old_rank: i,
						new_rank: -1,
						old_rank_show: this.rank2[i].rank_show,
						new_rank_show: -1,
						old_penalty: this.rank2[i].problem[j].old_penalty,
						new_penalty: this.rank2[i].problem[j].new_penalty
					};
					var tmp = this.rank2[i];
                    var ver = tmp.problem[j].new_verdict;
					if(ver == 'AC') {
                        var num = 100;
                        var ver2 = tmp.problem[j].old_verdict;
                        if (ver2[0] == 'P') {
                            var num2 = parseInt(ver2.substring(1, ver2.length));
                            num -= num2;
                        }
						tmp.score += num;
						//tmp.penalty += tmp.problem[j].new_penalty;
                    }else if (ver[0] == 'P') {
                        var num = parseInt(ver.substring(1, ver.length));
                        var ver2 = tmp.problem[j].old_verdict;
                        if (ver2[0] == 'P') {
                            var num2 = parseInt(ver2.substring(1, ver2.length));
                            var mx = max(num, num2);
                            ver = "P" + mx.toString();
                            if (num > num2)
                                num -= num2;
                            else
                                num = 0;
                        }
                        tmp.score += num;
                        console.log(num);
                    }
					tmp.problem[j].old_verdict = ver;
					tmp.problem[j].new_verdict = "NA";
					var k = i -1;
					while(k >= 0 && (this.rank2[k].score < tmp.score || this.rank2[k].score == tmp.score && this.rank2[k].penalty > tmp.penalty)) {
						if (tmp.rank_show !== "*" && this.rank2[k].rank_show !== "*") {
							tmp.rank_show--;
							this.rank2[k].rank_show++;
						}
						this.rank2[k+1] = this.rank2[k];
						k--;
					}
					this.rank2[k+1] = tmp;
					op.new_rank = k+1;
					op.new_rank_show = tmp.rank_show;
					this.operations.push(op);
					break;
				}
			}
		}
	}
    await sleep(100);
    var user_cnt = this.rank2.length;
    console.log("user:", user_cnt)
    for (var i = 1; i < user_cnt; i++) {
        var now = $('#rank-'+ i.toString());
        var prev = $('#rank-'+ (i - 1).toString());
        if (now.find('.solved').text() == prev.find('.solved').text() && now.find('.penalty').text() == prev.find('.penalty').text()) {
            console.log(now.find('.solved').text());
            now.find('.rank').text(prev.find('.rank').text());
        }
    }
}
