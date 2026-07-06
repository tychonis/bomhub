// https://github.com/deckarep/golang-set/issues/172
// TODO: consider replacing this if golang-set decides to keep its scope to minimalistic set operations.
//
// For now, we only need a simple string set implementation.
package auth

type StringSet struct {
	set map[string]struct{}
}

func NewStringSet() *StringSet {
	return &StringSet{
		set: make(map[string]struct{}),
	}
}

func (s *StringSet) Add(value string) {
	s.set[value] = struct{}{}
}

func (s *StringSet) Remove(value string) {
	delete(s.set, value)
}

func (s *StringSet) Contains(value string) bool {
	_, exists := s.set[value]
	return exists
}
