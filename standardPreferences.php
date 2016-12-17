<?php

define(ROOT_PATH,__DIR__.'/');

require_once ROOT_PATH.'preferenceCategory.php';
require_once ROOT_PATH.'preferences.php';
require_once ROOT_PATH.'time.php';

$StandardPreferences = Preferences(array(
  PreferenceCategory('mornings', function($sched) {
    $cutoff = Time(11,00);
    $score  = 0.0;
    foreach ($sched->$sections as $s) {
      if ($s->$start <= $cutoff) {
        // earlier sections score "more" than those just before the cutoff
        $score += ($cutoff->difference($s->$start, 'hours', true) * $s->daysPerWeek());
      }
    }
    // score should be in the 0-20 range
    return $score;
  }),
  PreferenceCategory('evenings', function($sched) {
    $cutoff = Time(16,00);
    $score  = 0.0;
    foreach ($sched->$sections as $s) {
      if ($s->$end <= $cutoff) {
        // later sections score "more" than those just after the cutoff
        $score += ($cutoff->difference($s->$end, 'hours', true) * $s->daysPerWeek());
      }
    }
    // score should be in the 0-20 range
    return $score;
  }),
  PreferenceCategory('mondays', function($sched) {
    $score = 0.0;
    foreach ($sched->$sections as $s) {
      if ($s->$days['monday']) {
        // longer sections score "more" than shorter ones.
        $score += $s->duration('hours');
      }
    }
    // score should be in the 0-12 range, double to keep in line with other scores
    return $score * 2;
  }),
  PreferenceCategory('fridays', function($sched) {
    $score = 0.0;
    foreach ($sched->$sections as $s) {
      if ($s->$days['friday']) {
        // longer sections score "more" than shorter ones.
        $score += $s->duration('hours');
      }
    }
    // score should be in the 0-12 range, double to keep in line with other scores
    return $score * 2;
  }),
  PreferenceCategory('balance', function($sched) {
    $score = 0.0;
    $hoursByDay = array(
      'monday'    => 0.0,
      'tuesday'   => 0.0,
      'wednesday' => 0.0,
      'thursday'  => 0.0,
      'friday'    => 0.0,
      'saturday'  => 0.0,
      'sunday'    => 0.0
    );
    foreach ($sched->$sections as $s) {
      $dur = $s->duration('hours');
      foreach ($s->$days as $day => $meets) {
        if ($meets) $hoursByDay[$day] += $dur;
      }
    }
    $avg = array_sum($hoursByDay) / 7;
    foreach ($hoursByDay as $hours) {
      // days that are closer to the average score better (less negatively)
      $score -= abs($avg - $hours);
    }
    // score should be in the 0-25 or 0-30 range, estimated
    return $score;
  })
));

?>