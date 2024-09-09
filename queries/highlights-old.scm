
(line_comment) @comment
(block_comment) @comment

(int_literal) @number
(dec_literal) @number

(str_literal) @string

(type_id) @type
(value_id) @variable
(member_value member: (value_id) @property)

(func_call func_id: (value_id) @function)
(param_value_decl decl_id: (value_id) @function (func_type))
(func_decl decl_id: (value_id) @function)

[
"+"
"-"
"*"
"/"
"%"
"!"
"&"
"^"
"?"
"::"
"..=" "=.."
"..<" "<.."
"..>" ">.."
"="
"+=" "-="
"*=" "/="
"==" "!="
"<=" ">="
"<" ">" "<>"
"->"
] @operator

[
"."
":"
","
";"
] @punctuation.delimiter

[
"("
")"
"["
"]"
"{"
"}"
"|"
] @punctuation.bracket

[
"true"
"false"
] @boolean

[
"uninit"
"null"
"void"
void: ["(" ")"]
] @constant.builtin

[
"import"
"use"
"as"
"struct"
"union"
"enum"
"trait"
"impl"
"for"
"pub"
"var"
"let"
"def"
"virt"
"if"
"switch"
"in"
"else"
"is"
"and"
"or"
"not"
"move"
"copy"
"sizeof"
"return"
"yield"
"break"
"continue"
"defer"
"do"
] @keyword

