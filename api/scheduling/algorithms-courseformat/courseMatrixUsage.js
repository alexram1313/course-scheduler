var conflicts = require('./courseConflicts.js');

function multiply(confMatrix, scheduleBuf, dimension) {
	// I'm not sure if I can get away with just saying 0 here,
	// or if I need to explicitly define the number of bytes I'm using.
	// Also, if I extend to using multiple array slots to get enough bits,
	// that might force my hand.
	var conflicts = 0;
	for (var i = 0; i < dimension; ++i) {
		conflicts |= (!!(confMatrix[i] & scheduleBuf)) << i;
	}
	return conflicts;
}

/*
Coreq Structure

The key to encoding the course dependency structures:
Draw out the corequirement structure as a tree, where a "parent" is corequired by all of its "children", that is, where taking the parent requires that you take at least one of the children.
To properly represent this, you need multiple starting places; that is to say, there are a set of section types, not just a single one, that you must take one of each of. So really, you have a forest, not a tree.

Now, form a list of indices of courses that corequire no other courses, grouped within their course-type. Call this list roots. Formally,
  roots = [[i : si->type == typej && si->coreqs == {}] : typej in [course-types]]
Next, form a 1-level representation of the forest as a list of lists of indices, as follows:
  forest = [ci : for all i, ci = [j : si in sj->coreqs]]
That is, the ith entry in forests is exactly those courses that corequire section si.

Now, we have a simple algorithm to calculate all possible schedules:
At each level, take exactly one option, recurring if necessary.
*/

function test_schedules(conflictMatrix, dimension, roots, forest) {
	function add_section(current, i) {
		var options = forest[i];
		current |= (1 << i);
		if (options.length == 0) {
			return [current];
		} else {
			return options.reduce(function(acc,o){
				return acc.concat(add_section(current,o));
			}, []);
		}
	}

	function consistent(schedule) {
		return !(multiply(conflictMatrix, schedule, dimension) & schedule);
	}

	function all_consistent(current, root_schedules) {
		// Explanation: takes a consistent schedule current and the root options
		// generated by running add_sections on every root, then generates-in-place
		// all the schedules, throwing out inconsistent ones as early as possible.
		if (root_schedules.length == 0){
			// no more schedules to add
			return [current];
		} else {
			// reduce one root_schedule into the list of consistent schedules
			return root_schedules[0].reduce(function(acc,root_schedule){
				if (consistent(current | root_schedule)) {
					// if current and root_schedule are compatible, add it in and continue recursively
					return acc.concat(all_consistent(current | root_schedule, root_schedules.slice(1)));
				} else {
					// otherwise, neglect this root_schedule.
					return acc;
				}
			}, []);
		}
	}

	root_schedules = roots.map(function(root_course){
		// generate all consistent schedules for each root_course
		return root_course.reduce(function(acc,root_section){
			return acc.concat(add_section(0,root_section));
		}, []);
	});
	console.log('root_schedules:', root_schedules); //TEMP
	return all_consistent(0,root_schedules);
}

function decode(scheduleBuf, section_list, dimension) {
	schedule = [];
	for (var i = 0; i < dimension; ++i) {
		if (scheduleBuf & (1 << i)) {
			schedule.push(section_list[i]);
		}
	}
	return schedule;
}



var data = conflicts.buildConflictMatrix(conflicts.courses);
console.log('data.matrix:', data.matrix); //TEMP
console.log('data.roots:', data.roots); //TEMP
console.log('data.forest:', data.forest); //TEMP
var schedules = test_schedules(data.matrix, data.list.length, data.roots, data.forest);
console.log('schedules:', schedules); //TEMP